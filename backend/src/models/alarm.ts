// 告警模型 - 基于仪表在线监测

import { getInstruments, Instrument } from './instrument'
import { addHandlingRecord } from './alarmHandling'

export interface Alarm {
  id: string
  instrumentId: string     // 仪表编号
  location: string         // 安装位置
  monitorType: string      // 监测类型
  unit: string             // 单位
  deviceId: string         // 设备号
  channelId: string        // 通道号
  alarmType: 'lowLow' | 'low' | 'high' | 'highHigh'
  severity: 'critical' | 'high' | 'medium' | 'low'
  value: number            // 触发值
  threshold: number        // 触发的阈值
  message: string          // 告警描述
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
  resolvedAt?: Date
  resolvedBy?: string
  note?: string
}

// 报警类型 -> 严重等级映射
const alarmSeverityMap: Record<string, Alarm['severity']> = {
  lowLow: 'critical',
  low: 'medium',
  high: 'high',
  highHigh: 'critical',
}

// 报警类型中文
const alarmTypeTextMap: Record<string, string> = {
  lowLow: '低低报警(LL)',
  low: '低报警(L)',
  high: '高报警(H)',
  highHigh: '高高报警(HH)',
}

// 内存存储
const alarms: Alarm[] = []

// 根据当前仪表数据生成告警
export async function generateAlarmsFromInstruments(): Promise<void> {
  const instruments = await getInstruments()

  for (const inst of instruments) {
    if (inst.alarmStatus === 'none' || inst.value === null) continue

    // 检查是否已有此仪表的活跃告警(同类型)
    const existingActive = alarms.find(
      a => a.instrumentId === inst.id && a.alarmType === inst.alarmStatus && a.status === 'active'
    )
    if (existingActive) {
      // 更新触发值
      existingActive.value = inst.value
      continue
    }

    // 获取触发的阈值
    let thresholdValue = 0
    switch (inst.alarmStatus) {
      case 'lowLow': thresholdValue = inst.threshold.lowLow ?? 0; break
      case 'low': thresholdValue = inst.threshold.low ?? 0; break
      case 'high': thresholdValue = inst.threshold.high ?? 0; break
      case 'highHigh': thresholdValue = inst.threshold.highHigh ?? 0; break
    }

    const alarm: Alarm = {
      id: `ALM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      instrumentId: inst.id,
      location: inst.location,
      monitorType: inst.monitorType,
      unit: inst.unit,
      deviceId: inst.deviceId,
      channelId: inst.channelId,
      alarmType: inst.alarmStatus as Alarm['alarmType'],
      severity: alarmSeverityMap[inst.alarmStatus] || 'low',
      value: inst.value,
      threshold: thresholdValue,
      message: `${inst.location} ${inst.monitorType} ${alarmTypeTextMap[inst.alarmStatus]}：当前值 ${inst.value}${inst.unit}，阈值 ${thresholdValue}${inst.unit}`,
      status: 'active',
      createdAt: new Date(),
    }
    alarms.push(alarm)
  }

  // 保持最多500条
  if (alarms.length > 500) alarms.splice(0, alarms.length - 500)
}

// 获取告警列表
export async function getAlarms(filter?: {
  instrumentId?: string
  status?: string
  severity?: string
  startTime?: Date
  endTime?: Date
  keyword?: string
}): Promise<Alarm[]> {
  // 先生成新告警
  await generateAlarmsFromInstruments()

  let result = [...alarms].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  if (filter) {
    if (filter.instrumentId) {
      result = result.filter(a => a.instrumentId === filter.instrumentId)
    }
    if (filter.status) {
      result = result.filter(a => a.status === filter.status)
    }
    if (filter.severity) {
      result = result.filter(a => a.severity === filter.severity)
    }
    if (filter.startTime) {
      result = result.filter(a => a.createdAt >= filter.startTime!)
    }
    if (filter.endTime) {
      result = result.filter(a => a.createdAt <= filter.endTime!)
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      result = result.filter(a =>
        a.instrumentId.toLowerCase().includes(kw) ||
        a.location.toLowerCase().includes(kw) ||
        a.monitorType.toLowerCase().includes(kw) ||
        a.message.toLowerCase().includes(kw) ||
        a.deviceId.toLowerCase().includes(kw)
      )
    }
  }

  return result
}

// 获取告警统计
export async function getAlarmStats(): Promise<{
  total: number
  active: number
  acknowledged: number
  resolved: number
  critical: number
  high: number
  medium: number
  low: number
}> {
  await generateAlarmsFromInstruments()
  return {
    total: alarms.length,
    active: alarms.filter(a => a.status === 'active').length,
    acknowledged: alarms.filter(a => a.status === 'acknowledged').length,
    resolved: alarms.filter(a => a.status === 'resolved').length,
    critical: alarms.filter(a => a.severity === 'critical').length,
    high: alarms.filter(a => a.severity === 'high').length,
    medium: alarms.filter(a => a.severity === 'medium').length,
    low: alarms.filter(a => a.severity === 'low').length,
  }
}

// 创建告警
export async function createAlarm(input: Omit<Alarm, 'id' | 'createdAt'>): Promise<Alarm> {
  const alarm: Alarm = {
    ...input,
    id: `ALM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date(),
  }
  alarms.push(alarm)
  if (alarms.length > 500) alarms.splice(0, alarms.length - 500)
  return alarm
}

// 确认告警
export async function acknowledgeAlarm(id: string, note?: string): Promise<boolean> {
  const alarm = alarms.find(a => a.id === id)
  if (!alarm) return false
  alarm.status = 'acknowledged'
  alarm.acknowledgedAt = new Date()
  alarm.acknowledgedBy = '管理员'
  if (note) alarm.note = note

  // 持久化处置记录
  addHandlingRecord({
    alarmId: alarm.id,
    instrumentId: alarm.instrumentId,
    location: alarm.location,
    monitorType: alarm.monitorType,
    unit: alarm.unit,
    deviceId: alarm.deviceId,
    channelId: alarm.channelId,
    alarmType: alarm.alarmType,
    severity: alarm.severity,
    triggerValue: alarm.value,
    threshold: alarm.threshold,
    alarmMessage: alarm.message,
    alarmTime: alarm.createdAt.toISOString(),
    handlingType: 'acknowledged',
    handledBy: '管理员',
    handledAt: new Date().toISOString(),
    note: note || '已确认告警',
  })

  return true
}

// 解决告警
export async function resolveAlarm(id: string, note?: string): Promise<boolean> {
  const alarm = alarms.find(a => a.id === id)
  if (!alarm) return false
  alarm.status = 'resolved'
  alarm.resolvedAt = new Date()
  alarm.resolvedBy = '管理员'

  // 持久化处置记录
  addHandlingRecord({
    alarmId: alarm.id,
    instrumentId: alarm.instrumentId,
    location: alarm.location,
    monitorType: alarm.monitorType,
    unit: alarm.unit,
    deviceId: alarm.deviceId,
    channelId: alarm.channelId,
    alarmType: alarm.alarmType,
    severity: alarm.severity,
    triggerValue: alarm.value,
    threshold: alarm.threshold,
    alarmMessage: alarm.message,
    alarmTime: alarm.createdAt.toISOString(),
    handlingType: 'resolved',
    handledBy: '管理员',
    handledAt: new Date().toISOString(),
    note: note || '已解决告警',
  })

  return true
}

// 删除告警
export async function deleteAlarm(id: string): Promise<boolean> {
  const idx = alarms.findIndex(a => a.id === id)
  if (idx === -1) return false
  alarms.splice(idx, 1)
  return true
}

// 获取告警统计 (兼容旧接口)
export async function getAlarmStatistics(
  deviceId: string,
  startTime: Date,
  endTime: Date
): Promise<{ total: number; critical: number; high: number; medium: number; low: number }> {
  const filtered = alarms.filter(a => {
    if (a.deviceId !== deviceId) return false
    if (a.createdAt < startTime || a.createdAt > endTime) return false
    return true
  })
  return {
    total: filtered.length,
    critical: filtered.filter(a => a.severity === 'critical').length,
    high: filtered.filter(a => a.severity === 'high').length,
    medium: filtered.filter(a => a.severity === 'medium').length,
    low: filtered.filter(a => a.severity === 'low').length,
  }
}
