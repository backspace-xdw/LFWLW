/**
 * 风险预警模型 - 六维度综合风险评估引擎
 *
 * 评估维度:
 *   1. 阈值接近度 (Proximity)    - 当前值距最近阈值的距离
 *   2. 波动性 (Volatility)       - 近期读数标准差
 *   3. 趋势分析 (Trend)          - 值变化方向与速度
 *   4. 设备健康度 (DeviceHealth)  - 故障/离线状态
 *   5. 告警历史 (AlarmHistory)    - 历史告警频次
 *   6. 关联分析 (Correlation)     - 同区域/关联参数联动
 *
 * 风险等级:
 *   0-25  安全 (safe)
 *  25-50  关注 (watch)
 *  50-75  预警 (warning)
 *  75-100 危险 (danger)
 */

import { getInstruments, getInstrument, Instrument } from './instrument'
import { getAlarms } from './alarm'

// ─── Types ───────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'watch' | 'warning' | 'danger'

export interface RiskFactors {
  proximity: number
  volatility: number
  trend: number
  deviceHealth: number
  alarmHistory: number
  correlation: number
}

export interface InstrumentRiskAssessment {
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  deviceId: string
  currentValue: number | null
  deviceStatus: string
  alarmStatus: string
  rangeMin: number
  rangeMax: number
  threshold: {
    lowLow: number | null
    low: number | null
    high: number | null
    highHigh: number | null
  }
  factors: RiskFactors
  compositeScore: number
  riskLevel: RiskLevel
  riskLevelText: string
  riskDescriptions: string[]
  timestamp: string
}

export interface RiskSummary {
  overallScore: number
  overallLevel: RiskLevel
  overallLevelText: string
  instrumentCount: number
  safeCount: number
  watchCount: number
  warningCount: number
  dangerCount: number
  topRisks: InstrumentRiskAssessment[]
  timestamp: string
}

export interface RiskTrendPoint {
  timestamp: string
  instrumentId: string
  compositeScore: number
  riskLevel: RiskLevel
}

export interface RiskWeightConfig {
  proximity: number
  volatility: number
  trend: number
  deviceHealth: number
  alarmHistory: number
  correlation: number
}

// ─── In-memory State ─────────────────────────────────────────────

// 每个仪表最近60条读数
const readingHistory: Map<string, { value: number; timestamp: number }[]> = new Map()
const MAX_READINGS = 60

// 风险趋势历史 (最近300条)
const riskTrendHistory: RiskTrendPoint[] = []
const MAX_TREND = 300

// 权重配置 (可动态调整)
let weightConfig: RiskWeightConfig = {
  proximity: 0.25,
  volatility: 0.12,
  trend: 0.23,
  deviceHealth: 0.15,
  alarmHistory: 0.13,
  correlation: 0.12,
}

// 关联分析分组: 同区域或关联参数的仪表
const correlationGroups: string[][] = [
  ['YB-001', 'YB-007'],              // 储罐区液位
  ['YB-002', 'YB-008'],              // 温度监测 (车间/锅炉)
  ['YB-003', 'YB-006', 'YB-011'],    // 压力/流量管路
  ['YB-004', 'YB-005', 'YB-009', 'YB-012'], // 气体检测
]

// ─── Utility Functions ───────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'danger'
  if (score >= 50) return 'warning'
  if (score >= 25) return 'watch'
  return 'safe'
}

function getRiskLevelText(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    safe: '安全', watch: '关注', warning: '预警', danger: '危险',
  }
  return map[level]
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** 简易线性回归斜率 */
function linearSlope(values: number[]): number {
  const n = values.length
  if (n < 3) return 0
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return 0
  return (n * sumXY - sumX * sumY) / denom
}

// ─── Factor Calculations ─────────────────────────────────────────

/** 因子1: 阈值接近度 (值距最近阈值越近，分数越高) */
function calcProximity(inst: Instrument): { score: number; desc: string } {
  if (inst.value === null || inst.value === undefined) {
    return { score: 0, desc: '' }
  }

  const range = inst.rangeMax - inst.rangeMin
  if (range <= 0) return { score: 0, desc: '' }

  const th = inst.threshold
  const thresholds: { name: string; value: number; label: string }[] = []
  if (th.lowLow !== null) thresholds.push({ name: 'LL', value: th.lowLow, label: '低低阈值' })
  if (th.low !== null) thresholds.push({ name: 'L', value: th.low, label: '低阈值' })
  if (th.high !== null) thresholds.push({ name: 'H', value: th.high, label: '高阈值' })
  if (th.highHigh !== null) thresholds.push({ name: 'HH', value: th.highHigh, label: '高高阈值' })

  if (thresholds.length === 0) return { score: 0, desc: '' }

  // 找到最近的阈值
  let minDist = Infinity
  let nearest = thresholds[0]
  for (const t of thresholds) {
    const dist = Math.abs(inst.value - t.value)
    if (dist < minDist) {
      minDist = dist
      nearest = t
    }
  }

  // 已经越过阈值 → 100分
  const isExceeded = inst.alarmStatus !== 'none'
  if (isExceeded) {
    return {
      score: 100,
      desc: `当前值${inst.value}${inst.unit}已超过${nearest.label}(${nearest.value}${inst.unit})`,
    }
  }

  // 距离百分比: 距阈值/量程 → 接近度分数
  const distPercent = minDist / range
  const score = clamp(100 - distPercent * 250) // 距离<40%量程 开始计分
  const desc = score > 30
    ? `当前值距${nearest.label}(${nearest.value}${inst.unit})仅${(distPercent * 100).toFixed(1)}%量程`
    : ''

  return { score, desc }
}

/** 因子2: 波动性 (近期标准差 / 量程) */
function calcVolatility(inst: Instrument): { score: number; desc: string } {
  const history = readingHistory.get(inst.id) || []
  if (history.length < 5) return { score: 0, desc: '' }

  const recentValues = history.slice(-20).map(r => r.value)
  const range = inst.rangeMax - inst.rangeMin
  if (range <= 0) return { score: 0, desc: '' }

  const sd = standardDeviation(recentValues)
  const sdPercent = sd / range
  const score = clamp(sdPercent * 500) // sd>20%量程 → 100分

  const desc = score > 40
    ? `近期波动较大，标准差${sd.toFixed(2)}${inst.unit}(${(sdPercent * 100).toFixed(1)}%量程)`
    : ''

  return { score, desc }
}

/** 因子3: 趋势分析 (值变化是否朝阈值方向) */
function calcTrend(inst: Instrument): { score: number; desc: string } {
  const history = readingHistory.get(inst.id) || []
  if (history.length < 5) return { score: 0, desc: '' }

  const recentValues = history.slice(-15).map(r => r.value)
  const slope = linearSlope(recentValues)
  const range = inst.rangeMax - inst.rangeMin
  if (range <= 0) return { score: 0, desc: '' }

  // 判断斜率方向是否朝向最近阈值
  const th = inst.threshold
  const val = inst.value ?? recentValues[recentValues.length - 1]

  // 上行趋势: 朝向高阈值
  let towardScore = 0
  let direction = ''
  if (slope > 0) {
    // 向上 → 看是否接近 H 或 HH
    const target = th.high ?? th.highHigh
    if (target !== null && val < target) {
      const normalizedSlope = Math.abs(slope) / range
      towardScore = clamp(normalizedSlope * 1500) // 快速接近 → 高分
      direction = '上升趋势接近高阈值'
    }
  } else if (slope < 0) {
    // 向下 → 看是否接近 L 或 LL
    const target = th.low ?? th.lowLow
    if (target !== null && val > target) {
      const normalizedSlope = Math.abs(slope) / range
      towardScore = clamp(normalizedSlope * 1500)
      direction = '下降趋势接近低阈值'
    }
  }

  const desc = towardScore > 30
    ? `检测到${direction}，变化速率${slope.toFixed(3)}${inst.unit}/次`
    : ''

  return { score: towardScore, desc }
}

/** 因子4: 设备健康度 */
function calcDeviceHealth(inst: Instrument): { score: number; desc: string } {
  switch (inst.deviceStatus) {
    case 'offline':
      return { score: 85, desc: '设备离线，无法监控实际状态，存在盲区风险' }
    case 'fault':
      return { score: 65, desc: '设备故障，数据可靠性下降' }
    default:
      return { score: 0, desc: '' }
  }
}

/** 因子5: 告警历史频次 */
async function calcAlarmHistory(inst: Instrument): Promise<{ score: number; desc: string }> {
  const allAlarms = await getAlarms({})
  const oneHourAgo = Date.now() - 3600000
  const recentAlarms = allAlarms.filter(
    (a: any) => a.instrumentId === inst.id && new Date(a.createdAt).getTime() > oneHourAgo
  )

  const count = recentAlarms.length
  const score = clamp(count * 12) // 每条告警+12分
  const desc = count > 2
    ? `近1小时内产生${count}条告警，报警频率较高`
    : ''

  return { score, desc }
}

/** 因子6: 关联分析 (同组仪表联动) */
function calcCorrelation(
  inst: Instrument,
  preScores: Map<string, number>,
): { score: number; desc: string } {
  const group = correlationGroups.find(g => g.includes(inst.id))
  if (!group) return { score: 0, desc: '' }

  const peers = group.filter(id => id !== inst.id)
  let maxPeerScore = 0
  let maxPeerId = ''

  for (const peerId of peers) {
    const ps = preScores.get(peerId) || 0
    if (ps > maxPeerScore) {
      maxPeerScore = ps
      maxPeerId = peerId
    }
  }

  if (maxPeerScore < 35) return { score: 0, desc: '' }

  const score = clamp(maxPeerScore * 0.45)
  const desc = score > 15
    ? `关联仪表${maxPeerId}风险较高(${maxPeerScore.toFixed(0)}分)，存在联动风险`
    : ''

  return { score, desc }
}

// ─── Main Assessment Engine ──────────────────────────────────────

function updateReadingHistory(instruments: Instrument[]): void {
  const now = Date.now()
  for (const inst of instruments) {
    if (inst.value === null || inst.value === undefined) continue
    let history = readingHistory.get(inst.id)
    if (!history) {
      history = []
      readingHistory.set(inst.id, history)
    }
    history.push({ value: inst.value, timestamp: now })
    if (history.length > MAX_READINGS) {
      history.splice(0, history.length - MAX_READINGS)
    }
  }
}

export async function assessAllRisks(): Promise<InstrumentRiskAssessment[]> {
  const instruments = await getInstruments()
  updateReadingHistory(instruments)

  // 第一轮: 计算前5个因子 (不含关联)
  const preScores: Map<string, number> = new Map()
  const partialResults: {
    inst: Instrument
    factors: Omit<RiskFactors, 'correlation'>
    descs: string[]
  }[] = []

  for (const inst of instruments) {
    const f1 = calcProximity(inst)
    const f2 = calcVolatility(inst)
    const f3 = calcTrend(inst)
    const f4 = calcDeviceHealth(inst)
    const f5 = await calcAlarmHistory(inst)

    const partial = {
      proximity: f1.score,
      volatility: f2.score,
      trend: f3.score,
      deviceHealth: f4.score,
      alarmHistory: f5.score,
    }

    // 前5因子加权 (不含关联)
    const preScore =
      partial.proximity * weightConfig.proximity +
      partial.volatility * weightConfig.volatility +
      partial.trend * weightConfig.trend +
      partial.deviceHealth * weightConfig.deviceHealth +
      partial.alarmHistory * weightConfig.alarmHistory

    preScores.set(inst.id, preScore / (1 - weightConfig.correlation))

    const descs = [f1.desc, f2.desc, f3.desc, f4.desc, f5.desc].filter(Boolean)
    partialResults.push({ inst, factors: partial, descs })
  }

  // 第二轮: 关联分析 + 最终合成
  const now = new Date().toISOString()
  const assessments: InstrumentRiskAssessment[] = []

  for (const { inst, factors, descs } of partialResults) {
    const f6 = calcCorrelation(inst, preScores)
    if (f6.desc) descs.push(f6.desc)

    const allFactors: RiskFactors = { ...factors, correlation: f6.score }

    const compositeScore = clamp(
      allFactors.proximity * weightConfig.proximity +
      allFactors.volatility * weightConfig.volatility +
      allFactors.trend * weightConfig.trend +
      allFactors.deviceHealth * weightConfig.deviceHealth +
      allFactors.alarmHistory * weightConfig.alarmHistory +
      allFactors.correlation * weightConfig.correlation,
    )

    const riskLevel = getRiskLevel(compositeScore)

    assessments.push({
      instrumentId: inst.id,
      location: inst.location,
      monitorType: inst.monitorType,
      unit: inst.unit,
      deviceId: inst.deviceId,
      currentValue: inst.value,
      deviceStatus: inst.deviceStatus,
      alarmStatus: inst.alarmStatus,
      rangeMin: inst.rangeMin,
      rangeMax: inst.rangeMax,
      threshold: inst.threshold,
      factors: allFactors,
      compositeScore: Math.round(compositeScore * 10) / 10,
      riskLevel,
      riskLevelText: getRiskLevelText(riskLevel),
      riskDescriptions: descs.length > 0 ? descs : ['各项指标正常'],
      timestamp: now,
    })

    // 记录趋势
    riskTrendHistory.push({
      timestamp: now,
      instrumentId: inst.id,
      compositeScore: Math.round(compositeScore * 10) / 10,
      riskLevel,
    })
  }

  // 限制趋势历史长度
  if (riskTrendHistory.length > MAX_TREND) {
    riskTrendHistory.splice(0, riskTrendHistory.length - MAX_TREND)
  }

  // 按风险分数降序
  assessments.sort((a, b) => b.compositeScore - a.compositeScore)
  return assessments
}

export async function getRiskSummary(): Promise<RiskSummary> {
  const assessments = await assessAllRisks()
  const now = new Date().toISOString()

  let totalScore = 0
  let safeCount = 0, watchCount = 0, warningCount = 0, dangerCount = 0

  for (const a of assessments) {
    totalScore += a.compositeScore
    switch (a.riskLevel) {
      case 'safe': safeCount++; break
      case 'watch': watchCount++; break
      case 'warning': warningCount++; break
      case 'danger': dangerCount++; break
    }
  }

  const overallScore = assessments.length > 0
    ? Math.round(totalScore / assessments.length * 10) / 10
    : 0

  // 整体风险取最高级别仪表的等级 (如果有任何一个危险，整体就是危险)
  let overallLevel: RiskLevel = 'safe'
  if (dangerCount > 0) overallLevel = 'danger'
  else if (warningCount > 0) overallLevel = 'warning'
  else if (watchCount > 0) overallLevel = 'watch'

  return {
    overallScore,
    overallLevel,
    overallLevelText: getRiskLevelText(overallLevel),
    instrumentCount: assessments.length,
    safeCount,
    watchCount,
    warningCount,
    dangerCount,
    topRisks: assessments.slice(0, 5),
    timestamp: now,
  }
}

export async function getInstrumentRisk(id: string): Promise<InstrumentRiskAssessment | null> {
  const assessments = await assessAllRisks()
  return assessments.find(a => a.instrumentId === id) || null
}

export function getRiskTrend(instrumentId?: string, count = 50): RiskTrendPoint[] {
  let data = riskTrendHistory
  if (instrumentId) {
    data = data.filter(p => p.instrumentId === instrumentId)
  }
  return data.slice(-count)
}

export function getRiskConfig(): RiskWeightConfig {
  return { ...weightConfig }
}

export function updateRiskConfig(config: Partial<RiskWeightConfig>): RiskWeightConfig {
  weightConfig = { ...weightConfig, ...config }
  // 确保权重总和=1
  const sum = Object.values(weightConfig).reduce((s, v) => s + v, 0)
  if (Math.abs(sum - 1) > 0.001) {
    const keys = Object.keys(weightConfig) as (keyof RiskWeightConfig)[]
    for (const k of keys) {
      weightConfig[k] = weightConfig[k] / sum
    }
  }
  return { ...weightConfig }
}
