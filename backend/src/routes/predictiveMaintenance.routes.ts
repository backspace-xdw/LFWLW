import { Router, Request, Response } from 'express'
import {
  getAllDeviceHealth,
  getHealthSummary,
  getAllRULPredictions,
  listWorkOrders,
  getWorkOrderStats,
  createWorkOrder,
  updateWorkOrderStatus,
  listMaintenancePlans,
  togglePlan,
  listMaintenanceRecords,
  getMaintenanceKPI,
  getOEESummary,
  WorkOrderStatus,
  WorkOrderType,
} from '../models/predictiveMaintenance'

const router = Router()

// ─── 1. 设备健康度 ─────────────────────────────────────────────────

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const data = await getAllDeviceHealth()
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取设备健康度失败' })
  }
})

router.get('/health/summary', async (_req: Request, res: Response) => {
  try {
    const data = await getHealthSummary()
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取健康度总览失败' })
  }
})

// ─── 2. 剩余寿命预测 ─────────────────────────────────────────────────

router.get('/rul', async (_req: Request, res: Response) => {
  try {
    const data = await getAllRULPredictions()
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取剩余寿命预测失败' })
  }
})

// ─── 3. 维护工单 ─────────────────────────────────────────────────────

router.get('/work-orders', async (req: Request, res: Response) => {
  try {
    const { status, type, instrumentId } = req.query as Record<string, string>
    const data = await listWorkOrders({
      status: status as WorkOrderStatus,
      type: type as WorkOrderType,
      instrumentId,
    })
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取工单列表失败' })
  }
})

router.get('/work-orders/stats', async (_req: Request, res: Response) => {
  try {
    const data = await getWorkOrderStats()
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取工单统计失败' })
  }
})

router.post('/work-orders', async (req: Request, res: Response) => {
  try {
    const data = await createWorkOrder(req.body)
    res.json({ code: 0, data, message: '工单创建成功' })
  } catch {
    res.status(500).json({ code: 1, message: '工单创建失败' })
  }
})

router.put('/work-orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, ...patch } = req.body
    const data = await updateWorkOrderStatus(req.params.id, status, patch)
    if (!data) {
      return res.status(404).json({ code: 1, message: '工单不存在' })
    }
    res.json({ code: 0, data, message: '工单状态已更新' })
  } catch {
    res.status(500).json({ code: 1, message: '更新工单失败' })
  }
})

// ─── 4. 维护计划 ─────────────────────────────────────────────────────

router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const data = await listMaintenancePlans()
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取维护计划失败' })
  }
})

router.put('/plans/:id/toggle', async (req: Request, res: Response) => {
  try {
    const data = await togglePlan(req.params.id)
    if (!data) {
      return res.status(404).json({ code: 1, message: '计划不存在' })
    }
    res.json({ code: 0, data, message: '计划状态已切换' })
  } catch {
    res.status(500).json({ code: 1, message: '切换计划失败' })
  }
})

// ─── 5. 维护台账 + KPI ─────────────────────────────────────────────

router.get('/records', async (req: Request, res: Response) => {
  try {
    const { instrumentId, type } = req.query as Record<string, string>
    const data = await listMaintenanceRecords({
      instrumentId,
      type: type as WorkOrderType,
    })
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取维护台账失败' })
  }
})

router.get('/kpi', async (_req: Request, res: Response) => {
  try {
    const data = await getMaintenanceKPI()
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取 KPI 失败' })
  }
})

router.get('/oee', async (_req: Request, res: Response) => {
  try {
    const data = await getOEESummary()
    res.json({ code: 0, data, message: 'success' })
  } catch {
    res.status(500).json({ code: 1, message: '获取 OEE 失败' })
  }
})

export default router
