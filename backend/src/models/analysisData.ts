/**
 * 数据分析引擎 — 为分析页面生成历史时序数据、告警分析、风险分析、综合报告
 */

import { getInstruments, Instrument, InstrumentThreshold } from './instrument'
import { getAlarms, getAlarmStats } from './alarm'
import { assessAllRisks, getRiskSummary, getRiskConfig, InstrumentRiskAssessment } from './riskWarning'

// ─── Types ──────────────────────────────────────────────────────

export interface HistoryDataPoint {
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  timestamp: string
  value: number
  alarmStatus: 'none' | 'low' | 'lowLow' | 'high' | 'highHigh'
}

export interface InstrumentSummary {
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  avg: number
  max: number
  min: number
  stdDev: number
  dataPoints: number
  alarmCount: number
  alarmRate: number
}

export interface AlarmTimelineItem {
  timestamp: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

export interface AlarmAnalysisResult {
  timeline: AlarmTimelineItem[]
  bySeverity: { severity: string; count: number }[]
  byMonitorType: { monitorType: string; count: number }[]
  byInstrument: { instrumentId: string; location: string; monitorType: string; count: number }[]
  byAlarmType: { alarmType: string; label: string; count: number }[]
  avgResponseMinutes: number
  resolutionRate: number
  stats: { total: number; active: number; acknowledged: number; resolved: number }
}

export interface RiskTrendItem {
  timestamp: string
  score: number
  level: string
}

export interface RiskAnalysisResult {
  overallTrend: RiskTrendItem[]
  instrumentTrends: {
    instrumentId: string
    location: string
    monitorType: string
    trend: { timestamp: string; score: number }[]
  }[]
  factorAverages: { factor: string; factorName: string; avgScore: number }[]
  levelDistribution: { timestamp: string; safe: number; watch: number; warning: number; danger: number }[]
  currentAssessments: InstrumentRiskAssessment[]
}

export interface ComprehensiveReport {
  period: { start: string; end: string }
  instrumentSummary: {
    total: number
    normal: number
    alarming: number
    fault: number
    offline: number
    monitorTypes: { monitorType: string; instrumentCount: number; avgValue: number; alarmRate: number }[]
  }
  alarmSummary: {
    totalAlarms: number
    resolutionRate: number
    avgResponseMinutes: number
    topAlarmInstruments: { instrumentId: string; location: string; count: number }[]
    severityBreakdown: { severity: string; count: number; percentage: number }[]
  }
  riskSummary: {
    overallScore: number
    overallLevel: string
    dangerCount: number
    warningCount: number
    topRiskFactors: { factor: string; name: string; avgScore: number }[]
  }
  recommendations: string[]
}

// ─── Utility ────────────────────────────────────────────────────

/** 基于种子的伪随机数 (0~1) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function calcAlarmStatus(value: number, th: InstrumentThreshold): HistoryDataPoint['alarmStatus'] {
  if (th.highHigh !== null && value >= th.highHigh) return 'highHigh'
  if (th.high !== null && value >= th.high) return 'high'
  if (th.lowLow !== null && value <= th.lowLow) return 'lowLow'
  if (th.low !== null && value <= th.low) return 'low'
  return 'none'
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function getRiskLevel(score: number): string {
  if (score >= 75) return 'danger'
  if (score >= 50) return 'warning'
  if (score >= 25) return 'watch'
  return 'safe'
}

// 按monitorType的数据特征配置
interface TypeProfile {
  period: number      // 正弦周期（小时）
  amplitude: number   // 振幅占量程百分比
  noise: number       // 噪声占量程百分比
  spikeProb: number   // 异常尖峰概率
  baseOffset: number  // 基值偏移（0=量程中点, >0偏上, <0偏下）
}

const typeProfiles: Record<string, TypeProfile> = {
  '液位':           { period: 12, amplitude: 0.15, noise: 0.02, spikeProb: 0.03, baseOffset: 0 },
  '温度':           { period: 24, amplitude: 0.12, noise: 0.03, spikeProb: 0.04, baseOffset: 0 },
  '压力':           { period: 8,  amplitude: 0.10, noise: 0.025, spikeProb: 0.04, baseOffset: 0 },
  '流量':           { period: 6,  amplitude: 0.18, noise: 0.03, spikeProb: 0.03, baseOffset: 0 },
  '可燃气体':       { period: 4,  amplitude: 0.05, noise: 0.02, spikeProb: 0.06, baseOffset: -0.3 },
  '有毒气体(H2S)':  { period: 4,  amplitude: 0.04, noise: 0.015, spikeProb: 0.05, baseOffset: -0.35 },
  '有毒气体(NH3)':  { period: 4,  amplitude: 0.04, noise: 0.015, spikeProb: 0.05, baseOffset: -0.35 },
}

function getProfile(monitorType: string): TypeProfile {
  return typeProfiles[monitorType] || { period: 8, amplitude: 0.12, noise: 0.03, spikeProb: 0.04, baseOffset: 0 }
}

// ─── 历史数据生成 ───────────────────────────────────────────────

function generateValue(inst: Instrument, timestamp: Date, profile: TypeProfile): number {
  const range = inst.rangeMax - inst.rangeMin
  const mid = (inst.rangeMax + inst.rangeMin) / 2 + profile.baseOffset * range
  const hours = timestamp.getTime() / 3600000
  const seed = timestamp.getTime() / 1000 + inst.id.charCodeAt(3) * 1000

  // 正弦基线
  const sine = Math.sin((2 * Math.PI * hours) / profile.period + inst.id.charCodeAt(3)) * profile.amplitude * range

  // 高斯噪声（Box-Muller近似）
  const u1 = seededRandom(seed)
  const u2 = seededRandom(seed + 1)
  const gaussian = Math.sqrt(-2 * Math.log(Math.max(u1, 0.001))) * Math.cos(2 * Math.PI * u2)
  const noise = gaussian * profile.noise * range

  // 异常尖峰
  let spike = 0
  if (seededRandom(seed + 2) < profile.spikeProb) {
    const direction = seededRandom(seed + 3) > 0.5 ? 1 : -1
    spike = direction * range * (0.3 + seededRandom(seed + 4) * 0.2)
  }

  let value = mid + sine + noise + spike
  // 裁剪到量程范围
  value = Math.max(inst.rangeMin, Math.min(inst.rangeMax, value))
  return Math.round(value * 100) / 100
}

export async function getInstrumentHistory(params: {
  instrumentIds?: string[]
  monitorTypes?: string[]
  startTime: Date
  endTime: Date
  interval: 'minute' | 'hour' | 'day'
}): Promise<HistoryDataPoint[]> {
  const instruments = await getInstruments()

  let filtered = instruments
  if (params.instrumentIds?.length) {
    filtered = filtered.filter(i => params.instrumentIds!.includes(i.id))
  }
  if (params.monitorTypes?.length) {
    filtered = filtered.filter(i => params.monitorTypes!.includes(i.monitorType))
  }

  const intervalMs = params.interval === 'minute' ? 60000
    : params.interval === 'hour' ? 3600000
    : 86400000

  // 限制最大数据点数
  const maxPoints = 500
  const totalSteps = Math.floor((params.endTime.getTime() - params.startTime.getTime()) / intervalMs)
  const step = Math.max(1, Math.floor(totalSteps / (maxPoints / Math.max(filtered.length, 1))))
  const actualInterval = intervalMs * step

  const result: HistoryDataPoint[] = []

  for (const inst of filtered) {
    const profile = getProfile(inst.monitorType)
    let t = params.startTime.getTime()
    while (t <= params.endTime.getTime()) {
      const ts = new Date(t)
      const value = generateValue(inst, ts, profile)
      const alarmStatus = calcAlarmStatus(value, inst.threshold)
      result.push({
        instrumentId: inst.id,
        location: inst.location,
        monitorType: inst.monitorType,
        unit: inst.unit,
        timestamp: ts.toISOString(),
        value,
        alarmStatus,
      })
      t += actualInterval
    }
  }

  return result
}

// ─── 仪表统计摘要 ───────────────────────────────────────────────

export async function getInstrumentSummary(params: {
  instrumentIds?: string[]
  monitorTypes?: string[]
  startTime: Date
  endTime: Date
}): Promise<InstrumentSummary[]> {
  const history = await getInstrumentHistory({
    ...params,
    interval: 'hour',
  })

  // 按仪表分组
  const groups = new Map<string, HistoryDataPoint[]>()
  for (const p of history) {
    const arr = groups.get(p.instrumentId) || []
    arr.push(p)
    groups.set(p.instrumentId, arr)
  }

  const result: InstrumentSummary[] = []
  for (const [id, points] of groups) {
    const values = points.map(p => p.value)
    const alarmCount = points.filter(p => p.alarmStatus !== 'none').length
    result.push({
      instrumentId: id,
      location: points[0].location,
      monitorType: points[0].monitorType,
      unit: points[0].unit,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) / 100,
      max: Math.max(...values),
      min: Math.min(...values),
      stdDev: Math.round(stdDev(values) * 100) / 100,
      dataPoints: values.length,
      alarmCount,
      alarmRate: Math.round((alarmCount / values.length) * 10000) / 100,
    })
  }

  return result
}

// ─── 告警分析 ────────────────────────────────────────────────────

const alarmTypeLabels: Record<string, string> = {
  lowLow: '低低报警(LL)',
  low: '低报警(L)',
  high: '高报警(H)',
  highHigh: '高高报警(HH)',
}

const severityMap: Record<string, string> = {
  lowLow: 'critical',
  low: 'medium',
  high: 'high',
  highHigh: 'critical',
}

export async function getAlarmAnalysis(params: {
  startTime: Date
  endTime: Date
  groupBy: 'hour' | 'day' | 'week'
}): Promise<AlarmAnalysisResult> {
  // 获取现有告警
  const existingAlarms = await getAlarms({})

  // 生成历史告警（基于仪表历史数据中的越限点）
  const history = await getInstrumentHistory({
    startTime: params.startTime,
    endTime: params.endTime,
    interval: 'hour',
  })

  // 合并：历史越限点 + 真实告警
  interface AlarmEntry {
    instrumentId: string
    location: string
    monitorType: string
    alarmType: string
    severity: string
    timestamp: Date
    status: string
  }

  const allAlarms: AlarmEntry[] = []

  // 从历史数据中提取越限事件
  for (const p of history) {
    if (p.alarmStatus !== 'none') {
      allAlarms.push({
        instrumentId: p.instrumentId,
        location: p.location,
        monitorType: p.monitorType,
        alarmType: p.alarmStatus,
        severity: severityMap[p.alarmStatus] || 'low',
        timestamp: new Date(p.timestamp),
        status: seededRandom(new Date(p.timestamp).getTime() + p.instrumentId.charCodeAt(3)) > 0.3 ? 'resolved' : 'active',
      })
    }
  }

  // 添加真实告警
  for (const a of existingAlarms) {
    if (a.createdAt >= params.startTime && a.createdAt <= params.endTime) {
      allAlarms.push({
        instrumentId: a.instrumentId,
        location: a.location,
        monitorType: a.monitorType,
        alarmType: a.alarmType,
        severity: a.severity,
        timestamp: a.createdAt,
        status: a.status,
      })
    }
  }

  // 时间线分组
  const bucketMs = params.groupBy === 'hour' ? 3600000
    : params.groupBy === 'day' ? 86400000
    : 604800000

  const timelineMap = new Map<string, { total: number; critical: number; high: number; medium: number; low: number }>()
  let t = params.startTime.getTime()
  while (t <= params.endTime.getTime()) {
    timelineMap.set(new Date(t).toISOString(), { total: 0, critical: 0, high: 0, medium: 0, low: 0 })
    t += bucketMs
  }

  for (const a of allAlarms) {
    const bucket = new Date(Math.floor(a.timestamp.getTime() / bucketMs) * bucketMs).toISOString()
    const entry = timelineMap.get(bucket)
    if (entry) {
      entry.total++
      if (a.severity === 'critical') entry.critical++
      else if (a.severity === 'high') entry.high++
      else if (a.severity === 'medium') entry.medium++
      else entry.low++
    }
  }

  const timeline: AlarmTimelineItem[] = Array.from(timelineMap.entries())
    .map(([timestamp, counts]) => ({ timestamp, ...counts }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  // 按严重等级
  const severityCounts = new Map<string, number>()
  for (const a of allAlarms) {
    severityCounts.set(a.severity, (severityCounts.get(a.severity) || 0) + 1)
  }
  const bySeverity = [
    { severity: '紧急', count: severityCounts.get('critical') || 0 },
    { severity: '高', count: severityCounts.get('high') || 0 },
    { severity: '中', count: severityCounts.get('medium') || 0 },
    { severity: '低', count: severityCounts.get('low') || 0 },
  ]

  // 按监测类型
  const typeCounts = new Map<string, number>()
  for (const a of allAlarms) {
    typeCounts.set(a.monitorType, (typeCounts.get(a.monitorType) || 0) + 1)
  }
  const byMonitorType = Array.from(typeCounts.entries())
    .map(([monitorType, count]) => ({ monitorType, count }))
    .sort((a, b) => b.count - a.count)

  // 按仪表
  const instCounts = new Map<string, { location: string; monitorType: string; count: number }>()
  for (const a of allAlarms) {
    const entry = instCounts.get(a.instrumentId) || { location: a.location, monitorType: a.monitorType, count: 0 }
    entry.count++
    instCounts.set(a.instrumentId, entry)
  }
  const byInstrument = Array.from(instCounts.entries())
    .map(([instrumentId, data]) => ({ instrumentId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 按告警类型
  const atCounts = new Map<string, number>()
  for (const a of allAlarms) {
    atCounts.set(a.alarmType, (atCounts.get(a.alarmType) || 0) + 1)
  }
  const byAlarmType = Array.from(atCounts.entries())
    .map(([alarmType, count]) => ({ alarmType, label: alarmTypeLabels[alarmType] || alarmType, count }))
    .sort((a, b) => b.count - a.count)

  // 统计
  const resolved = allAlarms.filter(a => a.status === 'resolved').length
  const acknowledged = allAlarms.filter(a => a.status === 'acknowledged').length
  const active = allAlarms.filter(a => a.status === 'active').length
  const total = allAlarms.length
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 10000) / 100 : 0
  const avgResponseMinutes = Math.round(5 + seededRandom(params.startTime.getTime()) * 25)

  return {
    timeline,
    bySeverity,
    byMonitorType,
    byInstrument,
    byAlarmType,
    avgResponseMinutes,
    resolutionRate,
    stats: { total, active, acknowledged, resolved },
  }
}

// ─── 风险分析 ────────────────────────────────────────────────────

export async function getRiskAnalysis(params: {
  instrumentIds?: string[]
  startTime: Date
  endTime: Date
}): Promise<RiskAnalysisResult> {
  // 获取当前评估
  const currentAssessments = await assessAllRisks()
  const summary = await getRiskSummary()

  let filtered = currentAssessments
  if (params.instrumentIds?.length) {
    filtered = filtered.filter(a => params.instrumentIds!.includes(a.instrumentId))
  }

  // 生成历史风险趋势（模拟）
  const intervalMs = 3600000 // 1小时间隔
  const steps = Math.min(168, Math.floor((params.endTime.getTime() - params.startTime.getTime()) / intervalMs))

  const overallTrend: RiskTrendItem[] = []
  const levelDistribution: { timestamp: string; safe: number; watch: number; warning: number; danger: number }[] = []
  const instTrendMap = new Map<string, { timestamp: string; score: number }[]>()

  for (const a of filtered) {
    instTrendMap.set(a.instrumentId, [])
  }

  for (let i = 0; i <= steps; i++) {
    const ts = new Date(params.startTime.getTime() + i * intervalMs)
    const tsStr = ts.toISOString()
    let totalScore = 0
    let safe = 0, watch = 0, warning = 0, danger = 0

    for (const a of filtered) {
      const seed = ts.getTime() / 1000 + a.instrumentId.charCodeAt(3) * 100
      // 基于当前分数的波动
      const baseScore = a.compositeScore
      const variation = (seededRandom(seed) - 0.5) * 30
      const score = Math.max(0, Math.min(100, Math.round((baseScore + variation) * 10) / 10))

      const level = getRiskLevel(score)
      if (level === 'safe') safe++
      else if (level === 'watch') watch++
      else if (level === 'warning') warning++
      else danger++

      totalScore += score
      instTrendMap.get(a.instrumentId)?.push({ timestamp: tsStr, score })
    }

    const avgScore = filtered.length > 0 ? Math.round((totalScore / filtered.length) * 10) / 10 : 0
    overallTrend.push({ timestamp: tsStr, score: avgScore, level: getRiskLevel(avgScore) })
    levelDistribution.push({ timestamp: tsStr, safe, watch, warning, danger })
  }

  // 六因子平均
  const factorNames: Record<string, string> = {
    proximity: '阈值接近度',
    volatility: '波动性',
    trend: '趋势分析',
    deviceHealth: '设备健康',
    alarmHistory: '告警历史',
    correlation: '关联分析',
  }
  const factorSums: Record<string, number> = { proximity: 0, volatility: 0, trend: 0, deviceHealth: 0, alarmHistory: 0, correlation: 0 }
  for (const a of filtered) {
    for (const key of Object.keys(factorSums)) {
      factorSums[key] += (a.factors as any)[key] || 0
    }
  }
  const factorAverages = Object.entries(factorSums).map(([factor, sum]) => ({
    factor,
    factorName: factorNames[factor] || factor,
    avgScore: filtered.length > 0 ? Math.round((sum / filtered.length) * 10) / 10 : 0,
  }))

  const instrumentTrends = Array.from(instTrendMap.entries()).map(([instrumentId, trend]) => {
    const a = filtered.find(x => x.instrumentId === instrumentId)!
    return {
      instrumentId,
      location: a.location,
      monitorType: a.monitorType,
      trend,
    }
  })

  return {
    overallTrend,
    instrumentTrends,
    factorAverages,
    levelDistribution,
    currentAssessments: filtered,
  }
}

// ─── 综合分析报告 ────────────────────────────────────────────────

export async function getComprehensiveReport(params: {
  startTime: Date
  endTime: Date
}): Promise<ComprehensiveReport> {
  const [instruments, alarmResult, riskSummary, instrumentSummaries] = await Promise.all([
    getInstruments(),
    getAlarmAnalysis({ ...params, groupBy: 'day' }),
    getRiskSummary(),
    getInstrumentSummary(params),
  ])

  // 监测概况
  const normal = instruments.filter(i => i.deviceStatus === 'normal' && i.alarmStatus === 'none').length
  const alarming = instruments.filter(i => i.alarmStatus !== 'none').length
  const fault = instruments.filter(i => i.deviceStatus === 'fault').length
  const offline = instruments.filter(i => i.deviceStatus === 'offline').length

  // 按类型汇总
  const typeMap = new Map<string, { count: number; totalValue: number; totalAlarmRate: number }>()
  for (const s of instrumentSummaries) {
    const entry = typeMap.get(s.monitorType) || { count: 0, totalValue: 0, totalAlarmRate: 0 }
    entry.count++
    entry.totalValue += s.avg
    entry.totalAlarmRate += s.alarmRate
    typeMap.set(s.monitorType, entry)
  }
  const monitorTypes = Array.from(typeMap.entries()).map(([monitorType, data]) => ({
    monitorType,
    instrumentCount: data.count,
    avgValue: Math.round((data.totalValue / data.count) * 100) / 100,
    alarmRate: Math.round((data.totalAlarmRate / data.count) * 100) / 100,
  }))

  // 告警概况
  const severityTotal = alarmResult.bySeverity.reduce((s, v) => s + v.count, 0)
  const severityBreakdown = alarmResult.bySeverity.map(s => ({
    ...s,
    percentage: severityTotal > 0 ? Math.round((s.count / severityTotal) * 10000) / 100 : 0,
  }))

  // 风险因子
  const riskAnalysis = await getRiskAnalysis(params)
  const topRiskFactors = riskAnalysis.factorAverages
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3)
    .map(f => ({ factor: f.factor, name: f.factorName, avgScore: f.avgScore }))

  // 生成建议
  const recommendations: string[] = []

  if (alarming > 0) {
    recommendations.push(`当前有 ${alarming} 个监测点处于报警状态，建议立即排查处理。`)
  }
  if (offline > 0) {
    recommendations.push(`${offline} 个设备离线，存在监控盲区，建议尽快恢复设备连接。`)
  }
  if (fault > 0) {
    recommendations.push(`${fault} 个设备故障，数据可靠性下降，建议安排维修。`)
  }
  if (alarmResult.resolutionRate < 70) {
    recommendations.push(`告警解决率仅 ${alarmResult.resolutionRate}%，建议加强告警响应流程。`)
  }
  if (riskSummary.dangerCount > 0) {
    recommendations.push(`${riskSummary.dangerCount} 个仪表处于危险风险等级，需优先关注。`)
  }

  const highAlarmInsts = alarmResult.byInstrument.filter(i => i.count > 5)
  if (highAlarmInsts.length > 0) {
    recommendations.push(`${highAlarmInsts.map(i => i.location).join('、')} 等位置告警频繁，建议检查设备或调整阈值。`)
  }

  if (recommendations.length === 0) {
    recommendations.push('各项指标正常，系统运行稳定。')
  }

  return {
    period: { start: params.startTime.toISOString(), end: params.endTime.toISOString() },
    instrumentSummary: {
      total: instruments.length,
      normal,
      alarming,
      fault,
      offline,
      monitorTypes,
    },
    alarmSummary: {
      totalAlarms: alarmResult.stats.total,
      resolutionRate: alarmResult.resolutionRate,
      avgResponseMinutes: alarmResult.avgResponseMinutes,
      topAlarmInstruments: alarmResult.byInstrument.slice(0, 5).map(i => ({
        instrumentId: i.instrumentId,
        location: i.location,
        count: i.count,
      })),
      severityBreakdown,
    },
    riskSummary: {
      overallScore: riskSummary.overallScore,
      overallLevel: riskSummary.overallLevelText,
      dangerCount: riskSummary.dangerCount,
      warningCount: riskSummary.warningCount,
      topRiskFactors,
    },
    recommendations,
  }
}

// ─── 辅助查询 ────────────────────────────────────────────────────

export async function getMonitorTypes(): Promise<string[]> {
  const instruments = await getInstruments()
  return [...new Set(instruments.map(i => i.monitorType))]
}
