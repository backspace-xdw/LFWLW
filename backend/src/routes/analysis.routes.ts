import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import {
  getInstrumentHistory,
  getInstrumentSummary,
  getAlarmAnalysis,
  getRiskAnalysis,
  getComprehensiveReport,
  getMonitorTypes,
} from '../models/analysisData'
import moment from 'moment'

const router = Router()

// 获取监测类型列表
router.get('/monitor-types', authenticate, async (_req, res) => {
  try {
    const types = await getMonitorTypes()
    res.json({ code: 0, data: types })
  } catch (error) {
    console.error('Get monitor types error:', error)
    res.status(500).json({ code: 500, message: '获取监测类型失败' })
  }
})

// 仪表历史时序数据
router.get('/instrument-history', authenticate, async (req, res) => {
  try {
    const { instrumentIds, monitorTypes, startTime, endTime, interval = 'hour' } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ code: 400, message: '缺少 startTime/endTime 参数' })
    }

    const data = await getInstrumentHistory({
      instrumentIds: instrumentIds ? (instrumentIds as string).split(',') : undefined,
      monitorTypes: monitorTypes ? (monitorTypes as string).split(',') : undefined,
      startTime: moment(startTime as string).toDate(),
      endTime: moment(endTime as string).toDate(),
      interval: (interval as 'minute' | 'hour' | 'day') || 'hour',
    })

    res.json({ code: 0, data })
  } catch (error) {
    console.error('Instrument history error:', error)
    res.status(500).json({ code: 500, message: '获取历史数据失败' })
  }
})

// 仪表统计摘要
router.get('/instrument-summary', authenticate, async (req, res) => {
  try {
    const { instrumentIds, monitorTypes, startTime, endTime } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ code: 400, message: '缺少 startTime/endTime 参数' })
    }

    const data = await getInstrumentSummary({
      instrumentIds: instrumentIds ? (instrumentIds as string).split(',') : undefined,
      monitorTypes: monitorTypes ? (monitorTypes as string).split(',') : undefined,
      startTime: moment(startTime as string).toDate(),
      endTime: moment(endTime as string).toDate(),
    })

    res.json({ code: 0, data })
  } catch (error) {
    console.error('Instrument summary error:', error)
    res.status(500).json({ code: 500, message: '获取统计摘要失败' })
  }
})

// 告警聚合分析
router.get('/alarm-analysis', authenticate, async (req, res) => {
  try {
    const { startTime, endTime, groupBy = 'day' } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ code: 400, message: '缺少 startTime/endTime 参数' })
    }

    const data = await getAlarmAnalysis({
      startTime: moment(startTime as string).toDate(),
      endTime: moment(endTime as string).toDate(),
      groupBy: (groupBy as 'hour' | 'day' | 'week') || 'day',
    })

    res.json({ code: 0, data })
  } catch (error) {
    console.error('Alarm analysis error:', error)
    res.status(500).json({ code: 500, message: '获取告警分析失败' })
  }
})

// 风险趋势分析
router.get('/risk-analysis', authenticate, async (req, res) => {
  try {
    const { instrumentIds, startTime, endTime } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ code: 400, message: '缺少 startTime/endTime 参数' })
    }

    const data = await getRiskAnalysis({
      instrumentIds: instrumentIds ? (instrumentIds as string).split(',') : undefined,
      startTime: moment(startTime as string).toDate(),
      endTime: moment(endTime as string).toDate(),
    })

    res.json({ code: 0, data })
  } catch (error) {
    console.error('Risk analysis error:', error)
    res.status(500).json({ code: 500, message: '获取风险分析失败' })
  }
})

// 综合分析报告
router.get('/comprehensive', authenticate, async (req, res) => {
  try {
    const { startTime, endTime } = req.query

    if (!startTime || !endTime) {
      return res.status(400).json({ code: 400, message: '缺少 startTime/endTime 参数' })
    }

    const data = await getComprehensiveReport({
      startTime: moment(startTime as string).toDate(),
      endTime: moment(endTime as string).toDate(),
    })

    res.json({ code: 0, data })
  } catch (error) {
    console.error('Comprehensive report error:', error)
    res.status(500).json({ code: 500, message: '获取综合报告失败' })
  }
})

// 数据导出
router.post('/export', authenticate, async (req, res) => {
  try {
    const { type, startTime, endTime, instrumentIds, monitorTypes, groupBy } = req.body

    if (!startTime || !endTime) {
      return res.status(400).json({ code: 400, message: '缺少时间参数' })
    }

    const start = moment(startTime).toDate()
    const end = moment(endTime).toDate()
    let csvContent = ''

    if (type === 'instrument') {
      const data = await getInstrumentHistory({
        instrumentIds,
        monitorTypes,
        startTime: start,
        endTime: end,
        interval: 'hour',
      })
      const headers = ['时间', '仪表编号', '位置', '监测类型', '数值', '单位', '报警状态']
      const rows = data.map(d => [
        moment(d.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        d.instrumentId, d.location, d.monitorType,
        d.value.toString(), d.unit, d.alarmStatus,
      ])
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    } else if (type === 'alarm') {
      const data = await getAlarmAnalysis({ startTime: start, endTime: end, groupBy: groupBy || 'day' })
      const headers = ['时间', '总数', '紧急', '高', '中', '低']
      const rows = data.timeline.map(t => [
        moment(t.timestamp).format('YYYY-MM-DD HH:mm'),
        t.total, t.critical, t.high, t.medium, t.low,
      ])
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    } else {
      return res.status(400).json({ code: 400, message: '不支持的导出类型' })
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=analysis_${type}_${moment().format('YYYYMMDD_HHmmss')}.csv`)
    res.send('\uFEFF' + csvContent)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ code: 500, message: '导出失败' })
  }
})

export default router
