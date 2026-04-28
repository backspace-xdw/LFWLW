// 预测性维护模型 - 设备健康度 / RUL / 工单 / 计划 / 台账

import { getInstruments } from './instrument'

// ─── Types ──────────────────────────────────────────────────────────

export interface HealthFactors {
  runtime: number          // 运行时长扣分 0-100
  alarmFrequency: number   // 告警频次扣分 0-100
  trendDeviation: number   // 趋势偏离扣分 0-100
  vibration: number        // 振动/波动扣分 0-100
  maintenanceLag: number   // 维护滞后扣分 0-100
}

export interface DeviceHealth {
  instrumentId: string
  location: string
  monitorType: string
  healthScore: number           // 0-100
  healthLevel: 'excellent' | 'good' | 'warning' | 'critical'
  healthLevelText: string
  factors: HealthFactors
  runtimeHours: number
  alarmsLast30Days: number
  lastMaintenance: string | null
  recommendation: string
  timestamp: string
}

export interface RULPrediction {
  instrumentId: string
  location: string
  monitorType: string
  remainingDays: number         // 预测剩余天数
  confidence: number            // 置信度 0-1
  predictedFailureDate: string  // 预测故障日期
  degradationRate: number       // 健康度日衰减率 (%/天)
  trendData: { date: string; health: number }[] // 历史 + 预测
  predictionStartIdx: number    // 预测起点索引
  riskLevel: 'low' | 'medium' | 'high'
}

export type WorkOrderStatus = 'pending' | 'in_progress' | 'pending_review' | 'closed'
export type WorkOrderType = 'preventive' | 'predictive' | 'corrective'
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkOrder {
  id: string
  title: string
  instrumentId: string
  location: string
  type: WorkOrderType
  typeText: string
  priority: WorkOrderPriority
  priorityText: string
  status: WorkOrderStatus
  statusText: string
  assignee: string | null
  description: string
  createdAt: string
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  closedAt: string | null
  cost: number | null
  notes: string | null
}

export type PlanType = 'preventive' | 'predictive'

export interface MaintenancePlan {
  id: string
  name: string
  instrumentId: string
  location: string
  type: PlanType
  typeText: string
  // preventive: 周期天数；predictive: 健康度阈值
  intervalDays: number | null
  healthThreshold: number | null
  responsible: string
  nextRunAt: string
  enabled: boolean
  description: string
}

export interface MaintenanceRecord {
  id: string
  instrumentId: string
  location: string
  workOrderId: string | null
  type: WorkOrderType
  typeText: string
  startedAt: string
  completedAt: string
  durationHours: number     // 维护耗时
  downtimeHours: number     // 停机时长
  cost: number
  technician: string
  faultDescription: string
  resolution: string
}

export interface MaintenanceKPI {
  totalRecords: number
  totalCost: number
  mtbfDays: number          // 平均故障间隔（天）
  mttrHours: number         // 平均修复时长（小时）
  totalDowntimeHours: number
  failureRateTrend: { month: string; failures: number; cost: number }[]
  paretoByInstrument: { instrumentId: string; location: string; failures: number }[]
}

// OEE — 设备综合效率
export interface DeviceOEE {
  instrumentId: string
  location: string
  availability: number   // 可用率 0-1
  performance: number    // 性能率 0-1
  quality: number        // 良品率 0-1
  oee: number            // = A × P × Q
  level: 'world_class' | 'good' | 'average' | 'low'
  levelText: string
}

export interface OEESummary {
  overall: {
    availability: number
    performance: number
    quality: number
    oee: number
    level: DeviceOEE['level']
    levelText: string
  }
  devices: DeviceOEE[]
  trend: { month: string; availability: number; performance: number; quality: number; oee: number }[]
  losses: { name: string; hours: number }[]   // 六大损失
}

// ─── Helpers ────────────────────────────────────────────────────────

const STATUS_TEXT: Record<WorkOrderStatus, string> = {
  pending: '待派单',
  in_progress: '执行中',
  pending_review: '待验收',
  closed: '已关闭',
}

const TYPE_TEXT: Record<WorkOrderType, string> = {
  preventive: '预防性',
  predictive: '预测性',
  corrective: '纠正性',
}

const PRIORITY_TEXT: Record<WorkOrderPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const PLAN_TYPE_TEXT: Record<PlanType, string> = {
  preventive: '预防性（按周期）',
  predictive: '预测性（按健康度）',
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function classifyHealth(score: number): { level: DeviceHealth['healthLevel']; text: string } {
  if (score >= 85) return { level: 'excellent', text: '优秀' }
  if (score >= 70) return { level: 'good', text: '良好' }
  if (score >= 50) return { level: 'warning', text: '关注' }
  return { level: 'critical', text: '危险' }
}

// 用 instrumentId 做种子，保证每次返回一致（演示稳定）
// FNV-1a 风格 + 后处理混合，避免相似 seed（YB-001/YB-002）产出相近值
function seededRand(seed: string, salt: number): number {
  let h = (salt * 2654435761) >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  // Mix
  h ^= h >>> 13
  h = (h * 2654435761) >>> 0
  h ^= h >>> 16
  return (h % 10000) / 10000
}

// ─── 1. 设备健康度评分 ────────────────────────────────────────────

export async function getAllDeviceHealth(): Promise<DeviceHealth[]> {
  const insts = await getInstruments()
  return insts.map((inst) => {
    const r = (s: number) => seededRand(inst.id, s)
    const factors: HealthFactors = {
      runtime: +(r(1) * 25).toFixed(1),
      alarmFrequency: +(r(2) * 30).toFixed(1),
      trendDeviation: +(r(3) * 20).toFixed(1),
      vibration: +(r(4) * 15).toFixed(1),
      maintenanceLag: +(r(5) * 20).toFixed(1),
    }
    const deduction =
      factors.runtime + factors.alarmFrequency + factors.trendDeviation +
      factors.vibration + factors.maintenanceLag
    const healthScore = +Math.max(0, Math.min(100, 100 - deduction * 0.5)).toFixed(1)
    const cls = classifyHealth(healthScore)
    const runtimeHours = randInt(2000, 18000)
    const alarmsLast30Days = randInt(0, 25)
    const lastMaintenance = r(6) > 0.2 ? daysAgo(randInt(5, 180)) : null
    const recommendation =
      healthScore < 50
        ? '建议立即安排预测性维护，防止故障'
        : healthScore < 70
        ? '建议加强监测，安排周期性巡检'
        : healthScore < 85
        ? '运行状态良好，按既定计划维护'
        : '设备状态优秀，无需特殊处理'
    return {
      instrumentId: inst.id,
      location: inst.location,
      monitorType: inst.monitorType,
      healthScore,
      healthLevel: cls.level,
      healthLevelText: cls.text,
      factors,
      runtimeHours,
      alarmsLast30Days,
      lastMaintenance,
      recommendation,
      timestamp: new Date().toISOString(),
    }
  })
}

export async function getHealthSummary() {
  const all = await getAllDeviceHealth()
  const total = all.length
  const counts = { excellent: 0, good: 0, warning: 0, critical: 0 }
  let sumScore = 0
  for (const h of all) {
    counts[h.healthLevel]++
    sumScore += h.healthScore
  }
  return {
    total,
    averageScore: +(sumScore / total).toFixed(1),
    counts,
    topRisk: all
      .slice()
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 5),
  }
}

// ─── 2. 剩余寿命预测 (RUL) ─────────────────────────────────────────

export async function getAllRULPredictions(): Promise<RULPrediction[]> {
  const healths = await getAllDeviceHealth()
  return healths.map((h) => {
    const r = (s: number) => seededRand(h.instrumentId, s + 100)
    // 当前健康度 + 日衰减率 → 推算剩余天数到达临界值 (40)
    const degradationRate = +(0.05 + r(1) * 0.4).toFixed(3) // 0.05~0.45 %/天
    const criticalThreshold = 40
    const remainingDays = Math.max(
      1,
      Math.round((h.healthScore - criticalThreshold) / Math.max(degradationRate, 0.01))
    )
    const cappedDays = Math.min(remainingDays, 720)
    const confidence = +(0.6 + r(2) * 0.35).toFixed(2)

    // 历史 30 天 + 预测 30 天健康度曲线
    const histLen = 30
    const predLen = 30
    const trendData: { date: string; health: number }[] = []
    for (let i = histLen; i >= 1; i--) {
      const noise = (r(i + 200) - 0.5) * 4
      const v = +Math.max(0, Math.min(100, h.healthScore + degradationRate * i + noise)).toFixed(1)
      trendData.push({ date: daysAgo(i).slice(0, 10), health: v })
    }
    trendData.push({ date: new Date().toISOString().slice(0, 10), health: h.healthScore })
    for (let i = 1; i <= predLen; i++) {
      const v = +Math.max(0, h.healthScore - degradationRate * i).toFixed(1)
      trendData.push({ date: daysFromNow(i).slice(0, 10), health: v })
    }

    const riskLevel: RULPrediction['riskLevel'] =
      cappedDays < 30 ? 'high' : cappedDays < 90 ? 'medium' : 'low'

    return {
      instrumentId: h.instrumentId,
      location: h.location,
      monitorType: h.monitorType,
      remainingDays: cappedDays,
      confidence,
      predictedFailureDate: daysFromNow(cappedDays).slice(0, 10),
      degradationRate,
      trendData,
      predictionStartIdx: histLen + 1, // 包含今天点
      riskLevel,
    }
  })
}

// ─── 3. 维护工单管理 ─────────────────────────────────────────────────

let workOrders: WorkOrder[] = []
let workOrdersInited = false

async function ensureWorkOrders() {
  if (!workOrdersInited) {
    workOrders = await generateWorkOrders()
    workOrdersInited = true
  }
}

async function generateWorkOrders(): Promise<WorkOrder[]> {
  const insts = await getInstruments()
  const titles = [
    '阈值偏移校准',
    '传感器更换',
    '通讯模块检修',
    '密封件更换',
    '电源稳定性维护',
    '探头清洁与标定',
    '布线检查',
    '固件升级',
  ]
  const technicians = ['张工', '李工', '王工', '赵工', '陈工']
  const orders: WorkOrder[] = []
  const statuses: WorkOrderStatus[] = ['pending', 'in_progress', 'pending_review', 'closed']
  const types: WorkOrderType[] = ['preventive', 'predictive', 'corrective']
  const priorities: WorkOrderPriority[] = ['low', 'medium', 'high', 'urgent']

  for (let i = 0; i < 18; i++) {
    const inst = pick(insts)
    const status = statuses[i % statuses.length]
    const type = pick(types)
    const priority = pick(priorities)
    const createdAt = daysAgo(randInt(1, 60))
    const scheduledAt = daysFromNow(randInt(-10, 30))
    const startedAt = status === 'pending' ? null : daysAgo(randInt(0, 20))
    const completedAt =
      status === 'pending_review' || status === 'closed' ? daysAgo(randInt(0, 10)) : null
    const closedAt = status === 'closed' ? daysAgo(randInt(0, 5)) : null

    orders.push({
      id: `WO-${String(2026000 + i).padStart(7, '0')}`,
      title: pick(titles),
      instrumentId: inst.id,
      location: inst.location,
      type,
      typeText: TYPE_TEXT[type],
      priority,
      priorityText: PRIORITY_TEXT[priority],
      status,
      statusText: STATUS_TEXT[status],
      assignee: status === 'pending' ? null : pick(technicians),
      description: `${pick(titles)} - 计划在 ${inst.location} 进行`,
      createdAt,
      scheduledAt,
      startedAt,
      completedAt,
      closedAt,
      cost: closedAt ? randInt(500, 8000) : null,
      notes: closedAt ? '维护完成，设备运行正常' : null,
    })
  }
  return orders
}

export async function listWorkOrders(filter?: {
  status?: WorkOrderStatus
  type?: WorkOrderType
  instrumentId?: string
}) {
  await ensureWorkOrders()
  let result = workOrders.slice()
  if (filter?.status) result = result.filter((w) => w.status === filter.status)
  if (filter?.type) result = result.filter((w) => w.type === filter.type)
  if (filter?.instrumentId) result = result.filter((w) => w.instrumentId === filter.instrumentId)
  return result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getWorkOrderStats() {
  await ensureWorkOrders()
  const stats = { pending: 0, in_progress: 0, pending_review: 0, closed: 0, total: workOrders.length }
  for (const w of workOrders) stats[w.status]++
  return stats
}

export async function createWorkOrder(input: Partial<WorkOrder>): Promise<WorkOrder> {
  await ensureWorkOrders()
  const id = `WO-${String(2026000 + workOrders.length).padStart(7, '0')}`
  const type = (input.type || 'corrective') as WorkOrderType
  const priority = (input.priority || 'medium') as WorkOrderPriority
  const order: WorkOrder = {
    id,
    title: input.title || '新工单',
    instrumentId: input.instrumentId || '',
    location: input.location || '',
    type,
    typeText: TYPE_TEXT[type],
    priority,
    priorityText: PRIORITY_TEXT[priority],
    status: 'pending',
    statusText: STATUS_TEXT.pending,
    assignee: input.assignee || null,
    description: input.description || '',
    createdAt: new Date().toISOString(),
    scheduledAt: input.scheduledAt || null,
    startedAt: null,
    completedAt: null,
    closedAt: null,
    cost: null,
    notes: null,
  }
  workOrders.unshift(order)
  return order
}

export async function updateWorkOrderStatus(
  id: string,
  status: WorkOrderStatus,
  patch?: Partial<WorkOrder>
): Promise<WorkOrder | null> {
  await ensureWorkOrders()
  const order = workOrders.find((w) => w.id === id)
  if (!order) return null
  order.status = status
  order.statusText = STATUS_TEXT[status]
  if (patch?.assignee !== undefined) order.assignee = patch.assignee
  if (patch?.notes !== undefined) order.notes = patch.notes
  if (patch?.cost !== undefined) order.cost = patch.cost
  const now = new Date().toISOString()
  if (status === 'in_progress' && !order.startedAt) order.startedAt = now
  if (status === 'pending_review' && !order.completedAt) order.completedAt = now
  if (status === 'closed' && !order.closedAt) order.closedAt = now
  return order
}

// ─── 4. 维护计划 ────────────────────────────────────────────────────

let maintenancePlans: MaintenancePlan[] = []
let plansInited = false

async function ensurePlans() {
  if (!plansInited) {
    maintenancePlans = await generatePlans()
    plansInited = true
  }
}

async function generatePlans(): Promise<MaintenancePlan[]> {
  const insts = await getInstruments()
  const responsibles = ['运维一组', '运维二组', '电仪车间', '外协单位']
  const plans: MaintenancePlan[] = []
  insts.forEach((inst, idx) => {
    const isPreventive = idx % 2 === 0
    if (isPreventive) {
      plans.push({
        id: `MP-${String(idx + 1).padStart(3, '0')}`,
        name: `${inst.location}-周期巡检`,
        instrumentId: inst.id,
        location: inst.location,
        type: 'preventive',
        typeText: PLAN_TYPE_TEXT.preventive,
        intervalDays: pick([30, 60, 90, 180]),
        healthThreshold: null,
        responsible: pick(responsibles),
        nextRunAt: daysFromNow(randInt(1, 60)),
        enabled: true,
        description: `按周期对 ${inst.monitorType} 进行例行巡检`,
      })
    } else {
      plans.push({
        id: `MP-${String(idx + 1).padStart(3, '0')}`,
        name: `${inst.location}-健康度触发维护`,
        instrumentId: inst.id,
        location: inst.location,
        type: 'predictive',
        typeText: PLAN_TYPE_TEXT.predictive,
        intervalDays: null,
        healthThreshold: pick([60, 65, 70]),
        responsible: pick(responsibles),
        nextRunAt: daysFromNow(randInt(7, 30)),
        enabled: idx % 5 !== 0,
        description: `健康度低于阈值时自动触发预测性维护`,
      })
    }
  })
  return plans
}

export async function listMaintenancePlans() {
  await ensurePlans()
  return maintenancePlans.slice()
}

export async function togglePlan(id: string): Promise<MaintenancePlan | null> {
  await ensurePlans()
  const plan = maintenancePlans.find((p) => p.id === id)
  if (!plan) return null
  plan.enabled = !plan.enabled
  return plan
}

// ─── 5. 维护台账 + KPI ─────────────────────────────────────────────

let maintenanceRecords: MaintenanceRecord[] = []
let recordsInited = false

async function ensureRecords() {
  if (!recordsInited) {
    maintenanceRecords = await generateRecords()
    recordsInited = true
  }
}

async function generateRecords(): Promise<MaintenanceRecord[]> {
  const insts = await getInstruments()
  const technicians = ['张工', '李工', '王工', '赵工', '陈工']
  const faults = [
    '传感器漂移超出允差',
    '通讯中断',
    '密封失效导致渗漏',
    '电源波动影响信号',
    '机械磨损导致响应迟滞',
    '外部温度异常引发误差',
  ]
  const resolutions = [
    '更换传感器并标定',
    '修复通讯线路并复测',
    '更换密封件',
    '加装稳压模块',
    '清洁并润滑机械部件',
    '更换隔热罩',
  ]
  const records: MaintenanceRecord[] = []
  for (let i = 0; i < 60; i++) {
    const inst = pick(insts)
    const startedAt = daysAgo(randInt(1, 360))
    const durationHours = +rand(0.5, 12).toFixed(1)
    const completedAt = new Date(new Date(startedAt).getTime() + durationHours * 3600 * 1000).toISOString()
    const downtimeHours = +rand(0, durationHours).toFixed(1)
    const type = pick<WorkOrderType>(['preventive', 'predictive', 'corrective'])
    records.push({
      id: `MR-${String(i + 1).padStart(4, '0')}`,
      instrumentId: inst.id,
      location: inst.location,
      workOrderId: i % 3 === 0 ? null : `WO-${String(2026000 + (i % 18)).padStart(7, '0')}`,
      type,
      typeText: TYPE_TEXT[type],
      startedAt,
      completedAt,
      durationHours,
      downtimeHours,
      cost: randInt(300, 12000),
      technician: pick(technicians),
      faultDescription: pick(faults),
      resolution: pick(resolutions),
    })
  }
  return records.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

export async function listMaintenanceRecords(filter?: { instrumentId?: string; type?: WorkOrderType }) {
  await ensureRecords()
  let result = maintenanceRecords.slice()
  if (filter?.instrumentId) result = result.filter((r) => r.instrumentId === filter.instrumentId)
  if (filter?.type) result = result.filter((r) => r.type === filter.type)
  return result
}

export async function getMaintenanceKPI(): Promise<MaintenanceKPI> {
  await ensureRecords()
  const records = maintenanceRecords
  const totalRecords = records.length
  const totalCost = records.reduce((s, r) => s + r.cost, 0)
  const totalDowntimeHours = +records.reduce((s, r) => s + r.downtimeHours, 0).toFixed(1)
  const correctiveRecords = records.filter((r) => r.type === 'corrective')
  const mttrHours = correctiveRecords.length
    ? +(correctiveRecords.reduce((s, r) => s + r.durationHours, 0) / correctiveRecords.length).toFixed(1)
    : 0
  // MTBF 粗算：360 天 * 设备数 / 故障次数
  const insts = await getInstruments()
  const mtbfDays = correctiveRecords.length
    ? +((360 * insts.length) / correctiveRecords.length).toFixed(1)
    : 0

  // 月度故障率 + 成本
  const now = new Date()
  const months: { month: string; failures: number; cost: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthRecords = records.filter((r) => r.startedAt.startsWith(monthKey))
    months.push({
      month: monthKey,
      failures: monthRecords.filter((r) => r.type === 'corrective').length,
      cost: monthRecords.reduce((s, r) => s + r.cost, 0),
    })
  }

  // Pareto 故障设备 TOP
  const counter: Record<string, { instrumentId: string; location: string; failures: number }> = {}
  for (const r of correctiveRecords) {
    if (!counter[r.instrumentId]) {
      counter[r.instrumentId] = { instrumentId: r.instrumentId, location: r.location, failures: 0 }
    }
    counter[r.instrumentId].failures++
  }
  const paretoByInstrument = Object.values(counter)
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 8)

  return {
    totalRecords,
    totalCost,
    mtbfDays,
    mttrHours,
    totalDowntimeHours,
    failureRateTrend: months,
    paretoByInstrument,
  }
}


// ─── OEE 设备综合效率（演示版） ─────────────────────────────────

function classifyOEE(oee: number): { level: DeviceOEE['level']; text: string } {
  if (oee >= 0.85) return { level: 'world_class', text: '世界级' }
  if (oee >= 0.75) return { level: 'good', text: '良好' }
  if (oee >= 0.6) return { level: 'average', text: '一般' }
  return { level: 'low', text: '偏低' }
}

// 计划生产时长（每设备 30 天 × 24h）
const PLANNED_HOURS_30D = 30 * 24

export async function getOEESummary(): Promise<OEESummary> {
  await ensureRecords()
  const insts = await getInstruments()

  // 30 天滚动窗口
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000
  const recent = maintenanceRecords.filter((r) => new Date(r.startedAt).getTime() >= cutoff)

  const devices: DeviceOEE[] = insts.map((inst) => {
    const downtimeHours = recent
      .filter((r) => r.instrumentId === inst.id)
      .reduce((s, r) => s + r.downtimeHours, 0)
    const availability = +Math.max(0.6, Math.min(1, 1 - downtimeHours / PLANNED_HOURS_30D)).toFixed(3)
    // 性能率 / 良品率：基于 instrumentId 哈希稳定生成（覆盖 4 个 OEE 等级以体现差异）
    const performance = +(0.78 + seededRand(inst.id, 901) * 0.20).toFixed(3) // 0.78~0.98
    const quality = +(0.88 + seededRand(inst.id, 902) * 0.10).toFixed(3) // 0.88~0.98
    const oee = +(availability * performance * quality).toFixed(3)
    const cls = classifyOEE(oee)
    return {
      instrumentId: inst.id,
      location: inst.location,
      availability,
      performance,
      quality,
      oee,
      level: cls.level,
      levelText: cls.text,
    }
  })

  // 厂区综合（按设备等权平均）
  const avg = (k: keyof DeviceOEE) =>
    +(devices.reduce((s, d) => s + (d[k] as number), 0) / devices.length).toFixed(3)
  const overallA = avg('availability')
  const overallP = avg('performance')
  const overallQ = avg('quality')
  const overallOEE = +(overallA * overallP * overallQ).toFixed(3)
  const overallCls = classifyOEE(overallOEE)

  // 12 个月趋势（用维护记录推算可用率，性能/良品做轻微波动）
  const now = new Date()
  const trend: OEESummary['trend'] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthDowntime = maintenanceRecords
      .filter((r) => r.startedAt.startsWith(monthKey))
      .reduce((s, r) => s + r.downtimeHours, 0)
    // 月计划工时 = 30 天 × 24h × 设备数
    const planned = 30 * 24 * insts.length
    const a = +Math.max(0.6, Math.min(1, 1 - monthDowntime / planned)).toFixed(3)
    const p = +(0.86 + seededRand(monthKey, 11) * 0.1).toFixed(3)
    const q = +(0.92 + seededRand(monthKey, 22) * 0.06).toFixed(3)
    trend.push({
      month: monthKey,
      availability: a,
      performance: p,
      quality: q,
      oee: +(a * p * q).toFixed(3),
    })
  }

  // 六大损失（小时数，演示数据）
  const correctiveHours = maintenanceRecords
    .filter((r) => r.type === 'corrective')
    .reduce((s, r) => s + r.downtimeHours, 0)
  const preventiveHours = maintenanceRecords
    .filter((r) => r.type === 'preventive')
    .reduce((s, r) => s + r.downtimeHours, 0)
  const losses = [
    { name: '故障停机', hours: +correctiveHours.toFixed(1) },
    { name: '换型调整', hours: +preventiveHours.toFixed(1) },
    { name: '小停机', hours: +(correctiveHours * 0.4).toFixed(1) },
    { name: '速度损失', hours: +(correctiveHours * 0.3).toFixed(1) },
    { name: '废品损失', hours: +(correctiveHours * 0.2).toFixed(1) },
    { name: '启动损失', hours: +(preventiveHours * 0.15).toFixed(1) },
  ]

  return {
    overall: {
      availability: overallA,
      performance: overallP,
      quality: overallQ,
      oee: overallOEE,
      level: overallCls.level,
      levelText: overallCls.text,
    },
    devices,
    trend,
    losses,
  }
}
