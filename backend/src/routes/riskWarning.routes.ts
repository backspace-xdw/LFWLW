import { Router, Request, Response } from 'express'
import {
  getRiskSummary,
  assessAllRisks,
  getInstrumentRisk,
  getRiskTrend,
  getRiskConfig,
  updateRiskConfig,
} from '../models/riskWarning'

const router = Router()

// GET /summary - 风险总览
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const data = await getRiskSummary()
    res.json({ code: 0, data, message: 'success' })
  } catch (err) {
    res.status(500).json({ code: 1, message: '获取风险总览失败' })
  }
})

// GET /assessments - 所有仪表风险评估
router.get('/assessments', async (_req: Request, res: Response) => {
  try {
    const data = await assessAllRisks()
    res.json({ code: 0, data, message: 'success' })
  } catch (err) {
    res.status(500).json({ code: 1, message: '获取风险评估失败' })
  }
})

// GET /trend - 风险趋势数据
router.get('/trend', (req: Request, res: Response) => {
  const instrumentId = req.query.instrumentId as string | undefined
  const count = parseInt(req.query.count as string) || 50
  const data = getRiskTrend(instrumentId, count)
  res.json({ code: 0, data, message: 'success' })
})

// GET /config - 获取权重配置
router.get('/config', (_req: Request, res: Response) => {
  const data = getRiskConfig()
  res.json({ code: 0, data, message: 'success' })
})

// PUT /config - 更新权重配置
router.put('/config', (req: Request, res: Response) => {
  const data = updateRiskConfig(req.body)
  res.json({ code: 0, data, message: '权重配置已更新' })
})

// GET /:id - 单个仪表风险评估
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await getInstrumentRisk(req.params.id)
    if (!data) {
      return res.status(404).json({ code: 1, message: '仪表不存在' })
    }
    res.json({ code: 0, data, message: 'success' })
  } catch (err) {
    res.status(500).json({ code: 1, message: '获取风险评估失败' })
  }
})

export default router
