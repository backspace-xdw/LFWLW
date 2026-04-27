// 告警处置记录 - JSON文件持久化存储
import fs from 'fs'
import path from 'path'

export interface AlarmHandlingRecord {
  id: string                // 处置记录ID
  alarmId: string           // 原始告警ID
  instrumentId: string      // 仪表编号
  location: string          // 安装位置
  monitorType: string       // 监测类型
  unit: string              // 单位
  deviceId: string          // 设备号
  channelId: string         // 通道号
  alarmType: string         // 报警类型 lowLow/low/high/highHigh
  severity: string          // 严重等级
  triggerValue: number      // 触发值
  threshold: number         // 阈值
  alarmMessage: string      // 原始告警信息
  alarmTime: string         // 告警触发时间
  // 处置信息
  handlingType: 'acknowledged' | 'resolved'  // 处置类型
  handledBy: string         // 处置人
  handledAt: string         // 处置时间
  note: string              // 处置说明
}

const DATA_FILE = path.join(__dirname, '../../data/alarm-handling.json')

// 从文件加载数据
function loadRecords(): AlarmHandlingRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {
    // 文件损坏时重置
  }
  return []
}

// 保存到文件
function saveRecords(records: AlarmHandlingRecord[]): void {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8')
}

// 新增处置记录
export function addHandlingRecord(record: Omit<AlarmHandlingRecord, 'id'>): AlarmHandlingRecord {
  const records = loadRecords()
  const newRecord: AlarmHandlingRecord = {
    ...record,
    id: `HDL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  }
  records.unshift(newRecord) // 最新的在前
  // 最多保留2000条
  if (records.length > 2000) records.splice(2000)
  saveRecords(records)
  return newRecord
}

// 查询处置记录
export function getHandlingRecords(filter?: {
  instrumentId?: string
  handlingType?: string
  severity?: string
  keyword?: string
  startTime?: string
  endTime?: string
}): AlarmHandlingRecord[] {
  let records = loadRecords()

  if (filter) {
    if (filter.instrumentId) {
      records = records.filter(r => r.instrumentId === filter.instrumentId)
    }
    if (filter.handlingType) {
      records = records.filter(r => r.handlingType === filter.handlingType)
    }
    if (filter.severity) {
      records = records.filter(r => r.severity === filter.severity)
    }
    if (filter.startTime) {
      records = records.filter(r => r.handledAt >= filter.startTime!)
    }
    if (filter.endTime) {
      records = records.filter(r => r.handledAt <= filter.endTime!)
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      records = records.filter(r =>
        r.instrumentId.toLowerCase().includes(kw) ||
        r.location.toLowerCase().includes(kw) ||
        r.monitorType.toLowerCase().includes(kw) ||
        r.deviceId.toLowerCase().includes(kw) ||
        r.note.toLowerCase().includes(kw) ||
        r.handledBy.toLowerCase().includes(kw)
      )
    }
  }

  return records
}

// 获取处置统计
export function getHandlingStats(): {
  total: number
  acknowledged: number
  resolved: number
  todayCount: number
} {
  const records = loadRecords()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return {
    total: records.length,
    acknowledged: records.filter(r => r.handlingType === 'acknowledged').length,
    resolved: records.filter(r => r.handlingType === 'resolved').length,
    todayCount: records.filter(r => r.handledAt.slice(0, 10) === today).length,
  }
}

// 删除处置记录
export function deleteHandlingRecord(id: string): boolean {
  const records = loadRecords()
  const idx = records.findIndex(r => r.id === id)
  if (idx === -1) return false
  records.splice(idx, 1)
  saveRecords(records)
  return true
}
