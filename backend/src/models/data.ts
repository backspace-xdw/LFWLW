// 模拟历史数据存储
interface HistoricalDataPoint {
  timestamp: Date
  deviceId: string
  temperature?: number
  pressure?: number
  flow?: number
  level?: number
  status: string
  hasAlarm?: boolean
}

// 获取历史数据
export async function getHistoricalData(
  startTime: Date, 
  endTime: Date, 
  deviceIds: string[]
): Promise<HistoricalDataPoint[]> {
  // 模拟生成历史数据
  const data: HistoricalDataPoint[] = []
  const interval = 5 * 60 * 1000 // 5分钟间隔
  
  for (const deviceId of deviceIds) {
    let currentTime = startTime.getTime()
    while (currentTime <= endTime.getTime()) {
      // 根据设备类型生成不同的数据
      const deviceData = generateDeviceData(deviceId, new Date(currentTime))
      data.push(deviceData)
      currentTime += interval
    }
  }
  
  return data
}

// 生成设备数据
function generateDeviceData(deviceId: string, timestamp: Date): HistoricalDataPoint {
  const baseTemp = 75
  const basePressure = 3.0
  
  // 添加一些随机波动
  const tempVariation = Math.sin(timestamp.getTime() / 3600000) * 10 + Math.random() * 5
  const pressureVariation = Math.cos(timestamp.getTime() / 3600000) * 0.5 + Math.random() * 0.3
  
  const temperature = baseTemp + tempVariation
  const pressure = basePressure + pressureVariation
  
  // 随机生成告警
  const hasAlarm = Math.random() < 0.05 // 5%的概率有告警
  
  return {
    timestamp,
    deviceId,
    temperature,
    pressure,
    flow: deviceId === 'PUMP_001' ? 120 + Math.random() * 30 : undefined,
    level: deviceId === 'TANK_005' ? 60 + Math.random() * 20 : undefined,
    status: hasAlarm ? 'alarm' : 'normal',
    hasAlarm,
  }
}

// 获取实时数据
export async function getRealtimeData(deviceId: string): Promise<HistoricalDataPoint> {
  return generateDeviceData(deviceId, new Date())
}