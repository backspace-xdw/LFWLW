import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { signalGenerator } from '../services/signalGenerator'

const router = Router()
router.use(authenticate)

// 历史数据存储（内存，最多保留 1000 条/设备）
const historyStore: Map<string, Array<{ timestamp: number; data: Record<string, number> }>> = new Map()
const MAX_HISTORY = 1000

// 监听实时数据写入历史
signalGenerator.on('data', (signal) => {
  const buf = historyStore.get(signal.deviceId) || []
  buf.push({ timestamp: signal.timestamp, data: signal.data as Record<string, number> })
  if (buf.length > MAX_HISTORY) buf.shift()
  historyStore.set(signal.deviceId, buf)
})

// 实时数据（当前快照）
router.get('/realtime/:deviceId', (req, res) => {
  const { deviceId } = req.params
  const latest = signalGenerator.getLatestData(deviceId)
  if (!latest) {
    return res.status(404).json({ code: 404, message: '设备不存在或暂无数据' })
  }
  res.json({ code: 0, message: 'success', data: latest })
})

// 历史数据查询
router.get('/history/:deviceId', (req, res) => {
  const { deviceId } = req.params
  const { startTime, endTime, limit = '100', parameter } = req.query

  const buf = historyStore.get(deviceId) || []
  let records = [...buf]

  if (startTime) {
    const ts = parseInt(startTime as string)
    records = records.filter(r => r.timestamp >= ts)
  }
  if (endTime) {
    const ts = parseInt(endTime as string)
    records = records.filter(r => r.timestamp <= ts)
  }

  // 提取指定参数
  let result: any[]
  if (parameter) {
    result = records.map(r => ({
      timestamp: r.timestamp,
      value: r.data[parameter as string],
    })).filter(r => r.value !== undefined)
  } else {
    result = records
  }

  // 限制返回数量
  const lim = Math.min(parseInt(limit as string), 1000)
  result = result.slice(-lim)

  res.json({ code: 0, message: 'success', data: { deviceId, records: result, total: result.length } })
})

// 设备数据模式（参数列表及元信息）
router.get('/schema/:deviceId', (req, res) => {
  const { deviceId } = req.params
  const params = signalGenerator.getDeviceParameterNames(deviceId)
  if (params.length === 0) {
    return res.status(404).json({ code: 404, message: '设备不存在' })
  }

  // 参数单位映射
  const UNITS: Record<string, string> = {
    temperature: '°C',
    pressure: 'MPa',
    flow: 'm³/h',
    rpm: 'rpm',
    vibration: 'mm/s',
    voltage: 'V',
    current: 'A',
    power: 'kW',
    level: '%',
    humidity: '%RH',
    position: '%',
  }

  const schema = params.map(p => ({
    name: p,
    unit: UNITS[p] || '',
    type: 'number',
  }))

  res.json({ code: 0, message: 'success', data: { deviceId, parameters: schema } })
})

// 统计摘要（最近 N 条记录的均值/最大/最小）
router.get('/stats/:deviceId', (req, res) => {
  const { deviceId } = req.params
  const { window = '60' } = req.query

  const buf = historyStore.get(deviceId) || []
  const windowMs = parseInt(window as string) * 1000
  const since = Date.now() - windowMs
  const records = buf.filter(r => r.timestamp >= since)

  if (records.length === 0) {
    return res.json({ code: 0, message: 'success', data: { deviceId, stats: {} } })
  }

  const params = signalGenerator.getDeviceParameterNames(deviceId)
  const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {}

  params.forEach(p => {
    const vals = records.map(r => r.data[p]).filter(v => v !== undefined)
    if (vals.length === 0) return
    const sum = vals.reduce((a, b) => a + b, 0)
    stats[p] = {
      avg: parseFloat((sum / vals.length).toFixed(2)),
      min: parseFloat(Math.min(...vals).toFixed(2)),
      max: parseFloat(Math.max(...vals).toFixed(2)),
      count: vals.length,
    }
  })

  res.json({ code: 0, message: 'success', data: { deviceId, windowSeconds: parseInt(window as string), stats } })
})

export default router
