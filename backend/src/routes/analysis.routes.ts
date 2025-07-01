import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { getDevices } from '../models/device'
import { getHistoricalData } from '../models/data'
import { getAlarmStatistics } from '../models/alarm'
import moment from 'moment'

const router = Router()

// 获取分析数据
router.get('/data', authenticate, async (req, res) => {
  try {
    const { startTime, endTime, deviceIds } = req.query
    
    // 参数验证
    if (!startTime || !endTime || !deviceIds) {
      return res.status(400).json({ message: '缺少必要参数' })
    }

    const start = moment(startTime as string)
    const end = moment(endTime as string)
    const devices = (deviceIds as string).split(',')

    // 获取历史数据
    const historicalData = await getHistoricalData(start.toDate(), end.toDate(), devices)
    
    // 计算统计信息
    const summary = calculateSummary(historicalData)
    
    // 计算分布数据
    const distribution = calculateDistribution(historicalData)
    
    // 获取设备对比数据
    const deviceComparison = await calculateDeviceComparison(devices, start.toDate(), end.toDate())
    
    // 计算相关性数据
    const correlation = calculateCorrelation(historicalData)

    res.json({
      summary,
      trends: historicalData,
      distribution,
      deviceComparison,
      correlation,
    })
  } catch (error) {
    console.error('Analysis data error:', error)
    res.status(500).json({ message: '获取分析数据失败' })
  }
})

// 获取设备列表
router.get('/devices', authenticate, async (req, res) => {
  try {
    const devices = await getDevices()
    res.json({ devices })
  } catch (error) {
    console.error('Get devices error:', error)
    res.status(500).json({ message: '获取设备列表失败' })
  }
})

// 导出数据
router.post('/export', authenticate, async (req, res) => {
  try {
    const { startTime, endTime, deviceIds, format = 'csv' } = req.body
    
    const start = moment(startTime)
    const end = moment(endTime)
    const devices = deviceIds

    // 获取历史数据
    const data = await getHistoricalData(start.toDate(), end.toDate(), devices)
    
    if (format === 'csv') {
      const csv = convertToCSV(data)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=data_export_${moment().format('YYYYMMDD_HHmmss')}.csv`)
      res.send(csv)
    } else {
      res.status(400).json({ message: '不支持的导出格式' })
    }
  } catch (error) {
    console.error('Export data error:', error)
    res.status(500).json({ message: '导出数据失败' })
  }
})

// 计算统计摘要
function calculateSummary(data: any[]) {
  if (data.length === 0) {
    return {
      avgTemperature: 0,
      avgPressure: 0,
      maxTemperature: 0,
      minTemperature: 0,
      maxPressure: 0,
      minPressure: 0,
      alarmCount: 0,
      dataPoints: 0,
    }
  }

  const temperatures = data.map(d => d.temperature).filter(t => t !== undefined)
  const pressures = data.map(d => d.pressure).filter(p => p !== undefined)

  return {
    avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
    avgPressure: pressures.reduce((a, b) => a + b, 0) / pressures.length,
    maxTemperature: Math.max(...temperatures),
    minTemperature: Math.min(...temperatures),
    maxPressure: Math.max(...pressures),
    minPressure: Math.min(...pressures),
    alarmCount: data.filter(d => d.hasAlarm).length,
    dataPoints: data.length,
  }
}

// 计算分布数据
function calculateDistribution(data: any[]) {
  const tempRanges = [
    { min: 60, max: 70, label: '60-70°C' },
    { min: 70, max: 80, label: '70-80°C' },
    { min: 80, max: 90, label: '80-90°C' },
    { min: 90, max: 100, label: '90-100°C' },
  ]

  const pressureRanges = [
    { min: 2, max: 2.5, label: '2-2.5 bar' },
    { min: 2.5, max: 3, label: '2.5-3 bar' },
    { min: 3, max: 3.5, label: '3-3.5 bar' },
    { min: 3.5, max: 4, label: '3.5-4 bar' },
  ]

  const tempDistribution = tempRanges.map(range => ({
    range: range.label,
    count: data.filter(d => d.temperature >= range.min && d.temperature < range.max).length,
  }))

  const pressureDistribution = pressureRanges.map(range => ({
    range: range.label,
    count: data.filter(d => d.pressure >= range.min && d.pressure < range.max).length,
  }))

  return {
    temperature: tempDistribution,
    pressure: pressureDistribution,
  }
}

// 计算设备对比数据
async function calculateDeviceComparison(deviceIds: string[], startTime: Date, endTime: Date) {
  const comparisons = []

  for (const deviceId of deviceIds) {
    const deviceData = await getHistoricalData(startTime, endTime, [deviceId])
    const alarmStats = await getAlarmStatistics(deviceId, startTime, endTime)
    
    const temperatures = deviceData.map(d => d.temperature).filter(t => t !== undefined)
    const pressures = deviceData.map(d => d.pressure).filter(p => p !== undefined)

    comparisons.push({
      deviceId,
      deviceName: getDeviceName(deviceId),
      avgTemperature: temperatures.length > 0 ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length : 0,
      avgPressure: pressures.length > 0 ? pressures.reduce((a, b) => a + b, 0) / pressures.length : 0,
      alarmCount: alarmStats.total,
    })
  }

  return comparisons
}

// 计算相关性数据
function calculateCorrelation(data: any[]) {
  return data
    .filter(d => d.temperature !== undefined && d.pressure !== undefined)
    .map(d => ({
      x: d.temperature,
      y: d.pressure,
      type: '温度-压力',
    }))
}

// 转换为CSV格式
function convertToCSV(data: any[]) {
  const headers = ['时间', '设备ID', '设备名称', '温度(°C)', '压力(bar)', '状态']
  const rows = data.map(d => [
    moment(d.timestamp).format('YYYY-MM-DD HH:mm:ss'),
    d.deviceId,
    getDeviceName(d.deviceId),
    d.temperature?.toFixed(2) || '',
    d.pressure?.toFixed(2) || '',
    d.status || 'normal',
  ])
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')
}

// 获取设备名称
function getDeviceName(deviceId: string): string {
  const deviceNames: Record<string, string> = {
    'PUMP_001': '主循环泵',
    'VALVE_002': '进料阀',
    'SENSOR_003': '温度传感器',
    'MOTOR_004': '驱动电机',
    'TANK_005': '储罐',
  }
  return deviceNames[deviceId] || deviceId
}

export default router