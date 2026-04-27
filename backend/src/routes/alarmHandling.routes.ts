import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { getHandlingRecords, getHandlingStats, deleteHandlingRecord } from '../models/alarmHandling'

const router = Router()
router.use(authenticate)

// 处置统计
router.get('/statistics', async (req, res) => {
  try {
    const stats = getHandlingStats()
    res.json({ code: 0, message: 'success', data: stats })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 查询处置记录（带分页和过滤）
router.get('/', async (req, res) => {
  try {
    const { instrumentId, handlingType, severity, keyword, startTime, endTime, page = '1', pageSize = '15' } = req.query
    const filter: any = {}
    if (instrumentId) filter.instrumentId = instrumentId as string
    if (handlingType) filter.handlingType = handlingType as string
    if (severity) filter.severity = severity as string
    if (keyword) filter.keyword = keyword as string
    if (startTime) filter.startTime = startTime as string
    if (endTime) filter.endTime = endTime as string

    const all = getHandlingRecords(filter)
    const pageNum = parseInt(page as string)
    const pageSz = parseInt(pageSize as string)
    const total = all.length
    const items = all.slice((pageNum - 1) * pageSz, pageNum * pageSz)

    res.json({ code: 0, message: 'success', data: { items, total, page: pageNum, pageSize: pageSz } })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

// 删除处置记录
router.delete('/:id', async (req, res) => {
  try {
    const ok = deleteHandlingRecord(req.params.id)
    if (!ok) return res.status(404).json({ code: 404, message: '记录不存在' })
    res.json({ code: 0, message: 'success' })
  } catch (e: any) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

export default router
