import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { signalGenerator } from '../services/signalGenerator'

const router = Router()
router.use(authenticate)

// 生产概览（可按时段聚合）
router.get('/production-overview', (req, res) => {
  const { period = '日' } = req.query

  const multiplier = period === '月' ? 30 : period === '周' ? 7 : 1

  res.json({
    code: 0, message: 'success',
    data: {
      period,
      output: parseFloat((1250 * multiplier + (Math.random() - 0.5) * 100 * multiplier).toFixed(1)),
      outputUnit: '件',
      efficiency: parseFloat((88 + (Math.random() - 0.5) * 10).toFixed(1)),
      qualityRate: parseFloat((96 + (Math.random() - 0.5) * 4).toFixed(1)),
      energyConsumption: parseFloat((3200 * multiplier + (Math.random() - 0.5) * 200 * multiplier).toFixed(1)),
      energyUnit: 'kWh',
      downtime: parseFloat((2.5 * multiplier + Math.random() * 0.5 * multiplier).toFixed(1)),
      downtimeUnit: 'h',
    },
  })
})

// KPI 指标
router.get('/kpi', (req, res) => {
  const ids = signalGenerator.getConfiguredDeviceIds()
  const running = ids.length
  const total = ids.length

  res.json({
    code: 0, message: 'success',
    data: {
      deviceRunning: running,
      deviceTotal: total,
      oee: parseFloat((82 + Math.random() * 10).toFixed(1)),
      yield: parseFloat((96 + Math.random() * 3).toFixed(1)),
      mtbf: parseFloat((240 + Math.random() * 40).toFixed(0)),
      mttr: parseFloat((1.5 + Math.random() * 0.5).toFixed(1)),
    },
  })
})

// 能耗数据（折线图用）
router.get('/energy', (req, res) => {
  const { period = '日' } = req.query
  const points = period === '月' ? 30 : period === '周' ? 7 : 24
  const labels = Array.from({ length: points }, (_, i) => {
    if (period === '月') return `${i + 1}日`
    if (period === '周') return ['周一','周二','周三','周四','周五','周六','周日'][i] || `${i+1}`
    return `${String(i).padStart(2, '0')}:00`
  })

  const data = labels.map(() => parseFloat((120 + Math.random() * 80).toFixed(1)))

  res.json({ code: 0, message: 'success', data: { labels, data, unit: 'kWh' } })
})

// 设备利用率
router.get('/utilization', (req, res) => {
  const ids = signalGenerator.getConfiguredDeviceIds()
  const utilization = ids.map(id => ({
    deviceId: id,
    rate: parseFloat((70 + Math.random() * 25).toFixed(1)),
  }))
  res.json({ code: 0, message: 'success', data: utilization })
})

// 实时设备状态汇总（给3D工厂用）
router.get('/device-states', (req, res) => {
  const ids = signalGenerator.getConfiguredDeviceIds()
  const states = ids.map(id => {
    const latest = signalGenerator.getLatestData(id)
    return {
      deviceId: id,
      status: 'online',
      data: latest?.data || {},
      timestamp: latest?.timestamp || Date.now(),
    }
  })
  res.json({ code: 0, message: 'success', data: states })
})

export default router
