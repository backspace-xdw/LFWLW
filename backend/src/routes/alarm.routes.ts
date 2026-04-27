import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { getAlarms, getAlarmStats, createAlarm, acknowledgeAlarm, resolveAlarm, deleteAlarm } from '../models/alarm'

const router = Router()
router.use(authenticate)

// 告警统计
router.get('/statistics', async (req, res) => {
  try {
    const stats = await getAlarmStats()
    res.json({ code: 0, message: 'success', data: stats })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 获取活跃告警列表
router.get('/active', async (req, res) => {
  try {
    const alarms = await getAlarms({ status: 'active' })
    res.json({ code: 0, message: 'success', data: alarms })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 获取告警列表（带过滤）
router.get('/', async (req, res) => {
  try {
    const { instrumentId, status, severity, startTime, endTime, keyword, page = '1', pageSize = '20' } = req.query
    const filter: any = {}
    if (instrumentId) filter.instrumentId = instrumentId as string
    if (status) filter.status = status as string
    if (severity) filter.severity = severity as string
    if (startTime) filter.startTime = new Date(startTime as string)
    if (endTime) filter.endTime = new Date(endTime as string)
    if (keyword) filter.keyword = keyword as string

    const all = await getAlarms(filter)
    const pageNum = parseInt(page as string)
    const pageSz = parseInt(pageSize as string)
    const total = all.length
    const items = all.slice((pageNum - 1) * pageSz, pageNum * pageSz)

    res.json({ code: 0, message: 'success', data: { items, total, page: pageNum, pageSize: pageSz } })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 确认告警
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { note } = req.body
    const ok = await acknowledgeAlarm(req.params.id, note)
    if (!ok) return res.status(404).json({ code: 404, message: '告警不存在' })
    res.json({ code: 0, message: 'success' })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 解除告警
router.put('/:id/resolve', async (req, res) => {
  try {
    const { note } = req.body || {}
    const ok = await resolveAlarm(req.params.id, note)
    if (!ok) return res.status(404).json({ code: 404, message: '告警不存在' })
    res.json({ code: 0, message: 'success' })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 删除告警
router.delete('/:id', async (req, res) => {
  try {
    const ok = await deleteAlarm(req.params.id)
    if (!ok) return res.status(404).json({ code: 404, message: '告警不存在' })
    res.json({ code: 0, message: 'success' })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 手动创建告警
router.post('/', async (req, res) => {
  try {
    const alarm = await createAlarm(req.body)
    res.json({ code: 0, message: 'success', data: alarm })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

export default router
