import { Router, Request, Response } from 'express'
import {
  getInstruments,
  getInstrument,
  getInstrumentStats,
  getInstrumentConfigs,
  createInstrument,
  updateInstrument,
  deleteInstrument,
  isDuplicateDeviceChannel,
  isDuplicateId,
} from '../models/instrument'

const router = Router()

// 获取所有仪表数据（在线监测用，带模拟刷新）
router.get('/', async (req: Request, res: Response) => {
  try {
    const { monitorType, deviceStatus, alarmStatus, keyword } = req.query
    let data = await getInstruments()

    if (monitorType && typeof monitorType === 'string') {
      data = data.filter(d => d.monitorType.includes(monitorType))
    }
    if (deviceStatus && typeof deviceStatus === 'string') {
      data = data.filter(d => d.deviceStatus === deviceStatus)
    }
    if (alarmStatus && typeof alarmStatus === 'string') {
      if (alarmStatus === 'alarming') {
        data = data.filter(d => d.alarmStatus !== 'none')
      } else {
        data = data.filter(d => d.alarmStatus === alarmStatus)
      }
    }
    if (keyword && typeof keyword === 'string') {
      const kw = keyword.toLowerCase()
      data = data.filter(d =>
        d.id.toLowerCase().includes(kw) ||
        d.location.toLowerCase().includes(kw) ||
        d.deviceId.toLowerCase().includes(kw)
      )
    }

    res.json({ code: 0, data, message: 'success' })
  } catch (error) {
    res.status(500).json({ code: 1, message: '获取仪表数据失败' })
  }
})

// 获取仪表统计
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getInstrumentStats()
    res.json({ code: 0, data: stats, message: 'success' })
  } catch (error) {
    res.status(500).json({ code: 1, message: '获取统计数据失败' })
  }
})

// 获取所有仪表配置（配置管理用，不刷新模拟值）
router.get('/config', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query
    let data = await getInstrumentConfigs()
    if (keyword && typeof keyword === 'string') {
      const kw = keyword.toLowerCase()
      data = data.filter(d =>
        d.id.toLowerCase().includes(kw) ||
        d.location.toLowerCase().includes(kw) ||
        d.deviceId.toLowerCase().includes(kw) ||
        d.monitorType.toLowerCase().includes(kw)
      )
    }
    res.json({ code: 0, data, message: 'success' })
  } catch (error) {
    res.status(500).json({ code: 1, message: '获取配置列表失败' })
  }
})

// 获取单个仪表数据
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const instrument = await getInstrument(req.params.id)
    if (!instrument) {
      return res.status(404).json({ code: 1, message: '仪表不存在' })
    }
    res.json({ code: 0, data: instrument, message: 'success' })
  } catch (error) {
    res.status(500).json({ code: 1, message: '获取仪表数据失败' })
  }
})

// 新增仪表
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body
    // 校验必填字段
    if (!body.id || !body.deviceId || !body.channelId || !body.monitorType || !body.unit) {
      return res.status(400).json({ code: 1, message: '仪表编号、设备号、通道号、监测类型、计量单位为必填项' })
    }
    // 校验仪表编号唯一
    if (isDuplicateId(body.id)) {
      return res.status(400).json({ code: 1, message: `仪表编号 ${body.id} 已存在` })
    }
    // 校验设备号+通道号唯一
    if (isDuplicateDeviceChannel(body.deviceId, body.channelId)) {
      return res.status(400).json({ code: 1, message: `设备号 ${body.deviceId} + 通道号 ${body.channelId} 已被占用，不可重复` })
    }

    const inst = await createInstrument({
      id: body.id,
      location: body.location || '',
      monitorType: body.monitorType,
      unit: body.unit,
      threshold: {
        lowLow: body.threshold?.lowLow ?? null,
        low: body.threshold?.low ?? null,
        high: body.threshold?.high ?? null,
        highHigh: body.threshold?.highHigh ?? null,
      },
      rangeMin: body.rangeMin ?? 0,
      rangeMax: body.rangeMax ?? 100,
      longitude: body.longitude ?? null,
      latitude: body.latitude ?? null,
      deviceId: body.deviceId,
      channelId: body.channelId,
      deviceStatus: body.deviceStatus || 'normal',
    })
    res.json({ code: 0, data: inst, message: '新增成功' })
  } catch (error) {
    res.status(500).json({ code: 1, message: '新增仪表失败' })
  }
})

// 更新仪表
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const body = req.body

    // 如果修改了设备号或通道号，校验唯一性
    if (body.deviceId !== undefined || body.channelId !== undefined) {
      const existing = await getInstrument(id)
      if (!existing) {
        return res.status(404).json({ code: 1, message: '仪表不存在' })
      }
      const newDeviceId = body.deviceId ?? existing.deviceId
      const newChannelId = body.channelId ?? existing.channelId
      if (isDuplicateDeviceChannel(newDeviceId, newChannelId, id)) {
        return res.status(400).json({ code: 1, message: `设备号 ${newDeviceId} + 通道号 ${newChannelId} 已被占用，不可重复` })
      }
    }

    const updateData: any = {}
    const fields = ['location', 'monitorType', 'unit', 'rangeMin', 'rangeMax', 'longitude', 'latitude', 'deviceId', 'channelId', 'deviceStatus']
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f]
    }
    if (body.threshold) {
      updateData.threshold = {
        lowLow: body.threshold.lowLow ?? null,
        low: body.threshold.low ?? null,
        high: body.threshold.high ?? null,
        highHigh: body.threshold.highHigh ?? null,
      }
    }

    const inst = await updateInstrument(id, updateData)
    if (!inst) {
      return res.status(404).json({ code: 1, message: '仪表不存在' })
    }
    res.json({ code: 0, data: inst, message: '更新成功' })
  } catch (error) {
    res.status(500).json({ code: 1, message: '更新仪表失败' })
  }
})

// 删除仪表
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ok = await deleteInstrument(req.params.id)
    if (!ok) {
      return res.status(404).json({ code: 1, message: '仪表不存在' })
    }
    res.json({ code: 0, message: '删除成功' })
  } catch (error) {
    res.status(500).json({ code: 1, message: '删除仪表失败' })
  }
})

export default router
