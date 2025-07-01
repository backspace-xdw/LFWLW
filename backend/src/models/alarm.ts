// 告警模型
export interface Alarm {
  id: string
  deviceId: string
  deviceName: string
  type: 'temperature' | 'pressure' | 'flow' | 'level' | 'status'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  value?: number
  threshold?: number
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
}

// 模拟告警数据存储
const alarms: Alarm[] = []

// 获取告警统计
export async function getAlarmStatistics(
  deviceId: string, 
  startTime: Date, 
  endTime: Date
): Promise<{ total: number; critical: number; high: number; medium: number; low: number }> {
  // 模拟告警统计数据
  const total = Math.floor(Math.random() * 20)
  const critical = Math.floor(total * 0.1)
  const high = Math.floor(total * 0.2)
  const medium = Math.floor(total * 0.3)
  const low = total - critical - high - medium
  
  return { total, critical, high, medium, low }
}

// 获取告警列表
export async function getAlarms(filter?: {
  deviceId?: string
  startTime?: Date
  endTime?: Date
  status?: string
}): Promise<Alarm[]> {
  let result = [...alarms]
  
  if (filter) {
    if (filter.deviceId) {
      result = result.filter(a => a.deviceId === filter.deviceId)
    }
    if (filter.startTime) {
      result = result.filter(a => a.createdAt >= filter.startTime!)
    }
    if (filter.endTime) {
      result = result.filter(a => a.createdAt <= filter.endTime!)
    }
    if (filter.status) {
      result = result.filter(a => a.status === filter.status)
    }
  }
  
  return result
}

// 创建新告警
export async function createAlarm(alarm: Omit<Alarm, 'id' | 'createdAt'>): Promise<Alarm> {
  const newAlarm: Alarm = {
    ...alarm,
    id: `ALARM_${Date.now()}`,
    createdAt: new Date(),
  }
  alarms.push(newAlarm)
  return newAlarm
}

// 更新告警状态
export async function updateAlarmStatus(id: string, status: 'acknowledged' | 'resolved'): Promise<void> {
  const alarm = alarms.find(a => a.id === id)
  if (alarm) {
    alarm.status = status
    if (status === 'acknowledged') {
      alarm.acknowledgedAt = new Date()
    } else if (status === 'resolved') {
      alarm.resolvedAt = new Date()
    }
  }
}