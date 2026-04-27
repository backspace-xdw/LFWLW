// 仪表模型 - 在线监测模块

export interface InstrumentThreshold {
  lowLow: number | null   // 低二阈值
  low: number | null      // 低一阈值
  high: number | null     // 高一阈值
  highHigh: number | null // 高二阈值
}

export interface Instrument {
  id: string               // 仪表编号
  location: string         // 安装位置
  monitorType: string      // 监测化学品/物理属性
  unit: string             // 计量单位
  threshold: InstrumentThreshold // 阈值
  rangeMin: number         // 量程下限
  rangeMax: number         // 量程上限
  longitude: number | null // 经度
  latitude: number | null  // 纬度
  deviceId: string         // 设备号
  channelId: string        // 通道号
  collectTime: string      // 数据采集时间
  value: number | null     // 数据值
  deviceStatus: 'normal' | 'fault' | 'offline' // 设备状态
  alarmStatus: 'none' | 'lowLow' | 'low' | 'high' | 'highHigh' // 报警状态
}

// 根据阈值和数据值计算报警状态
function calcAlarmStatus(value: number | null, threshold: InstrumentThreshold): Instrument['alarmStatus'] {
  if (value === null) return 'none'
  if (threshold.highHigh !== null && value >= threshold.highHigh) return 'highHigh'
  if (threshold.high !== null && value >= threshold.high) return 'high'
  if (threshold.lowLow !== null && value <= threshold.lowLow) return 'lowLow'
  if (threshold.low !== null && value <= threshold.low) return 'low'
  return 'none'
}

// 生成模拟随机数据值
function randomValue(min: number, max: number): number {
  return +(min + Math.random() * (max - min)).toFixed(2)
}

// 模拟仪表数据
const instruments: Instrument[] = [
  {
    id: 'YB-001',
    location: '储罐区A-1号储罐',
    monitorType: '液位',
    unit: 'm',
    threshold: { lowLow: 0.5, low: 1.0, high: 8.0, highHigh: 9.0 },
    rangeMin: 0,
    rangeMax: 10,
    longitude: 121.4737,
    latitude: 31.2304,
    deviceId: 'DEV-A001',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: 5.32,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
  {
    id: 'YB-002',
    location: '反应釜车间B区',
    monitorType: '温度',
    unit: '\u2103',
    threshold: { lowLow: -10, low: 0, high: 80, highHigh: 100 },
    rangeMin: -20,
    rangeMax: 150,
    longitude: 121.4740,
    latitude: 31.2310,
    deviceId: 'DEV-B002',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: 42.8,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
  {
    id: 'YB-003',
    location: '管道汇合处C区',
    monitorType: '压力',
    unit: 'MPa',
    threshold: { lowLow: 0.05, low: 0.1, high: 1.2, highHigh: 1.5 },
    rangeMin: 0,
    rangeMax: 2.0,
    longitude: 121.4745,
    latitude: 31.2315,
    deviceId: 'DEV-C003',
    channelId: 'CH-02',
    collectTime: new Date().toISOString(),
    value: 0.85,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
  {
    id: 'YB-004',
    location: '原料仓库入口',
    monitorType: '可燃气体',
    unit: '%LEL',
    threshold: { lowLow: null, low: null, high: 25, highHigh: 50 },
    rangeMin: 0,
    rangeMax: 100,
    longitude: 121.4750,
    latitude: 31.2320,
    deviceId: 'DEV-D004',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: 3.2,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
  {
    id: 'YB-005',
    location: '废气处理塔顶部',
    monitorType: '有毒气体(H2S)',
    unit: 'ppm',
    threshold: { lowLow: null, low: null, high: 10, highHigh: 20 },
    rangeMin: 0,
    rangeMax: 100,
    longitude: 121.4755,
    latitude: 31.2325,
    deviceId: 'DEV-E005',
    channelId: 'CH-03',
    collectTime: new Date().toISOString(),
    value: 2.1,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
  {
    id: 'YB-006',
    location: '冷却水循环系统',
    monitorType: '流量',
    unit: 'm\u00b3/h',
    threshold: { lowLow: 5, low: 10, high: 80, highHigh: 95 },
    rangeMin: 0,
    rangeMax: 100,
    longitude: 121.4760,
    latitude: 31.2330,
    deviceId: 'DEV-F006',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: 45.6,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
  {
    id: 'YB-007',
    location: '2号储罐区',
    monitorType: '液位',
    unit: 'm',
    threshold: { lowLow: 0.5, low: 1.0, high: 8.0, highHigh: 9.0 },
    rangeMin: 0,
    rangeMax: 10,
    longitude: 121.4738,
    latitude: 31.2306,
    deviceId: 'DEV-A007',
    channelId: 'CH-02',
    collectTime: new Date().toISOString(),
    value: 8.5,
    deviceStatus: 'normal',
    alarmStatus: 'high',
  },
  {
    id: 'YB-008',
    location: '锅炉房',
    monitorType: '温度',
    unit: '\u2103',
    threshold: { lowLow: 20, low: 40, high: 200, highHigh: 250 },
    rangeMin: 0,
    rangeMax: 300,
    longitude: 121.4742,
    latitude: 31.2312,
    deviceId: 'DEV-B008',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: 185.3,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
  {
    id: 'YB-009',
    location: '氨气泄漏监测点',
    monitorType: '有毒气体(NH3)',
    unit: 'ppm',
    threshold: { lowLow: null, low: null, high: 25, highHigh: 50 },
    rangeMin: 0,
    rangeMax: 200,
    longitude: 121.4748,
    latitude: 31.2318,
    deviceId: 'DEV-G009',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: 28.5,
    deviceStatus: 'normal',
    alarmStatus: 'high',
  },
  {
    id: 'YB-010',
    location: '配电室',
    monitorType: '温度',
    unit: '\u2103',
    threshold: { lowLow: 5, low: 10, high: 35, highHigh: 40 },
    rangeMin: -10,
    rangeMax: 60,
    longitude: 121.4752,
    latitude: 31.2322,
    deviceId: 'DEV-H010',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: null,
    deviceStatus: 'offline',
    alarmStatus: 'none',
  },
  {
    id: 'YB-011',
    location: '成品罐出口',
    monitorType: '压力',
    unit: 'MPa',
    threshold: { lowLow: 0.02, low: 0.05, high: 0.8, highHigh: 1.0 },
    rangeMin: 0,
    rangeMax: 1.5,
    longitude: 121.4758,
    latitude: 31.2328,
    deviceId: 'DEV-I011',
    channelId: 'CH-02',
    collectTime: new Date().toISOString(),
    value: 0.03,
    deviceStatus: 'fault',
    alarmStatus: 'low',
  },
  {
    id: 'YB-012',
    location: '危化品存储间',
    monitorType: '可燃气体',
    unit: '%LEL',
    threshold: { lowLow: null, low: null, high: 20, highHigh: 40 },
    rangeMin: 0,
    rangeMax: 100,
    longitude: 121.4762,
    latitude: 31.2332,
    deviceId: 'DEV-J012',
    channelId: 'CH-01',
    collectTime: new Date().toISOString(),
    value: 5.8,
    deviceStatus: 'normal',
    alarmStatus: 'none',
  },
]

// 模拟数据刷新 - 随机更新value和collectTime
function refreshInstrumentData(inst: Instrument): Instrument {
  if (inst.deviceStatus === 'offline') {
    return { ...inst, collectTime: new Date().toISOString(), value: null, alarmStatus: 'none' }
  }
  const value = randomValue(inst.rangeMin, inst.rangeMax)
  const alarmStatus = calcAlarmStatus(value, inst.threshold)
  return {
    ...inst,
    value,
    alarmStatus,
    collectTime: new Date().toISOString(),
  }
}

// 获取所有仪表数据
export async function getInstruments(): Promise<Instrument[]> {
  return instruments.map(refreshInstrumentData)
}

// 获取单个仪表数据
export async function getInstrument(id: string): Promise<Instrument | undefined> {
  const inst = instruments.find(i => i.id === id)
  return inst ? refreshInstrumentData(inst) : undefined
}

// 获取仪表统计
export async function getInstrumentStats() {
  const data = instruments.map(refreshInstrumentData)
  const total = data.length
  const normal = data.filter(d => d.deviceStatus === 'normal' && d.alarmStatus === 'none').length
  const alarming = data.filter(d => d.alarmStatus !== 'none').length
  const fault = data.filter(d => d.deviceStatus === 'fault').length
  const offline = data.filter(d => d.deviceStatus === 'offline').length
  return { total, normal, alarming, fault, offline }
}

// ====== 配置管理 CRUD ======

// 获取所有仪表配置（不刷新模拟值，返回原始配置）
export async function getInstrumentConfigs(): Promise<Instrument[]> {
  return instruments.map(i => ({ ...i }))
}

// 检查 设备号+通道号 唯一性
export function isDuplicateDeviceChannel(deviceId: string, channelId: string, excludeId?: string): boolean {
  return instruments.some(i => i.deviceId === deviceId && i.channelId === channelId && i.id !== excludeId)
}

// 检查仪表编号唯一性
export function isDuplicateId(id: string): boolean {
  return instruments.some(i => i.id === id)
}

// 新增仪表
export interface InstrumentCreateInput {
  id: string
  location: string
  monitorType: string
  unit: string
  threshold: InstrumentThreshold
  rangeMin: number
  rangeMax: number
  longitude: number | null
  latitude: number | null
  deviceId: string
  channelId: string
  deviceStatus: Instrument['deviceStatus']
}

export async function createInstrument(input: InstrumentCreateInput): Promise<Instrument> {
  const inst: Instrument = {
    ...input,
    collectTime: new Date().toISOString(),
    value: null,
    alarmStatus: 'none',
  }
  instruments.push(inst)
  return inst
}

// 更新仪表
export async function updateInstrument(id: string, input: Partial<InstrumentCreateInput>): Promise<Instrument | null> {
  const idx = instruments.findIndex(i => i.id === id)
  if (idx === -1) return null
  const existing = instruments[idx]
  instruments[idx] = { ...existing, ...input }
  return instruments[idx]
}

// 删除仪表
export async function deleteInstrument(id: string): Promise<boolean> {
  const idx = instruments.findIndex(i => i.id === id)
  if (idx === -1) return false
  instruments.splice(idx, 1)
  return true
}
