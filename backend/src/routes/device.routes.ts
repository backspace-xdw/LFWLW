import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { signalGenerator } from '../services/signalGenerator'

const router = Router()
router.use(authenticate)

// 设备元数据定义
const DEVICE_METADATA: Record<string, { name: string; type: string; location: string; manufacturer: string; model: string }> = {
  PUMP_001: { name: '离心泵-01', type: 'pump', location: '泵房A', manufacturer: 'XDW', model: 'CP-2000' },
  VALVE_002: { name: '电动阀门-02', type: 'valve', location: '管道区B', manufacturer: 'XDW', model: 'EV-500' },
  SENSOR_003: { name: '温度传感器-03', type: 'sensor', location: '监测区C', manufacturer: 'XDW', model: 'TS-100' },
  MOTOR_004: { name: '三相电机-04', type: 'motor', location: '动力区D', manufacturer: 'XDW', model: 'EM-3000' },
  TANK_005: { name: '储罐-05', type: 'tank', location: '储罐区E', manufacturer: 'XDW', model: 'ST-5000' },
}

// 设备状态（运行时维护）
const deviceStatuses: Record<string, 'online' | 'offline' | 'fault'> = {
  PUMP_001: 'online',
  VALVE_002: 'online',
  SENSOR_003: 'online',
  MOTOR_004: 'online',
  TANK_005: 'online',
}

// 获取设备列表
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, type } = req.query
  const pageNum = parseInt(page as string)
  const pageSz = parseInt(pageSize as string)

  let deviceIds = signalGenerator.getConfiguredDeviceIds()

  if (status) {
    deviceIds = deviceIds.filter(id => deviceStatuses[id] === status)
  }
  if (type) {
    deviceIds = deviceIds.filter(id => DEVICE_METADATA[id]?.type === type)
  }

  const total = deviceIds.length
  const paged = deviceIds.slice((pageNum - 1) * pageSz, pageNum * pageSz)

  const items = paged.map(id => ({
    deviceId: id,
    ...DEVICE_METADATA[id],
    status: deviceStatuses[id] || 'online',
    parameters: signalGenerator.getDeviceParameterNames(id),
  }))

  res.json({ code: 0, message: 'success', data: { items, total, page: pageNum, pageSize: pageSz } })
})

// 获取单个设备详情
router.get('/:deviceId', (req, res) => {
  const { deviceId } = req.params
  const meta = DEVICE_METADATA[deviceId]
  if (!meta) {
    return res.status(404).json({ code: 404, message: '设备不存在' })
  }

  const latestData = signalGenerator.getLatestData(deviceId)
  res.json({
    code: 0,
    message: 'success',
    data: {
      deviceId,
      ...meta,
      status: deviceStatuses[deviceId] || 'online',
      parameters: signalGenerator.getDeviceParameterNames(deviceId),
      latestData: latestData?.data || null,
      lastSeen: latestData?.timestamp || null,
    },
  })
})

// 更新设备状态
router.put('/:deviceId/status', (req, res) => {
  const { deviceId } = req.params
  const { status } = req.body
  if (!DEVICE_METADATA[deviceId]) {
    return res.status(404).json({ code: 404, message: '设备不存在' })
  }
  if (!['online', 'offline', 'fault'].includes(status)) {
    return res.status(400).json({ code: 400, message: '无效的状态值' })
  }
  deviceStatuses[deviceId] = status
  res.json({ code: 0, message: 'success', data: { deviceId, status } })
})

// 模拟设备故障
router.post('/:deviceId/simulate-fault', (req, res) => {
  const { deviceId } = req.params
  const { parameter, faultValue, duration = 5000 } = req.body
  if (!DEVICE_METADATA[deviceId]) {
    return res.status(404).json({ code: 404, message: '设备不存在' })
  }
  signalGenerator.simulateFault(deviceId, parameter, faultValue, duration)
  res.json({ code: 0, message: 'success', data: { message: `已触发 ${deviceId}/${parameter} 故障模拟` } })
})

export default router
