import { Server, Socket } from 'socket.io'
import { logger } from '../utils/logger'
import DataSimulator from '../services/dataSimulator'
import jwt from 'jsonwebtoken'

let dataSimulator: DataSimulator | null = null

export const initializeSocketIO = (io: Server) => {
  // 初始化数据模拟器
  dataSimulator = new DataSimulator(io)
  dataSimulator.start()

  // Socket.IO 认证中间件
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token
      
      // 开发环境允许无token连接
      if (!token && process.env.NODE_ENV === 'development') {
        socket.data.userId = 'dev-user'
        socket.data.username = 'developer'
        return next()
      }
      
      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
      socket.data.userId = decoded.userId
      socket.data.username = decoded.username
      next()
    } catch (err) {
      logger.error('Socket authentication failed:', err)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.data.username})`)
    
    // 加入用户房间
    socket.join(`user:${socket.data.userId}`)
    
    // 处理设备数据订阅
    socket.on('subscribe:device', (deviceIds: string[]) => {
      deviceIds.forEach(deviceId => {
        socket.join(`device:${deviceId}`)
        // 发送设备当前状态
        const currentStatus = dataSimulator?.signalGenerator?.getDeviceStatus?.(deviceId)
        if (currentStatus) {
          socket.emit('device:data', currentStatus)
        }
      })
      logger.info(`Socket ${socket.id} subscribed to devices: ${deviceIds.join(', ')}`)
    })
    
    // 处理设备数据取消订阅
    socket.on('unsubscribe:device', (deviceIds: string[]) => {
      deviceIds.forEach(deviceId => {
        socket.leave(`device:${deviceId}`)
      })
      logger.info(`Socket ${socket.id} unsubscribed from devices: ${deviceIds.join(', ')}`)
    })
    
    // 处理实时监控订阅
    socket.on('subscribe:monitor', () => {
      socket.join('monitor:realtime')
      logger.info(`Socket ${socket.id} subscribed to realtime monitor`)
    })
    
    // 处理告警订阅
    socket.on('subscribe:alarms', (filters?: { severity?: string[] }) => {
      socket.join('alarms:all')
      if (filters?.severity) {
        filters.severity.forEach(level => {
          socket.join(`alarms:${level}`)
        })
      }
      logger.info(`Socket ${socket.id} subscribed to alarms`)
    })
    
    // 处理设备控制命令
    socket.on('device:control', async (data: {
      deviceId: string
      command: string
      parameters?: any
    }, callback) => {
      try {
        logger.info(`Device control command from ${socket.data.username}: ${JSON.stringify(data)}`)
        
        // 模拟设备控制响应
        const response = {
          success: true,
          deviceId: data.deviceId,
          command: data.command,
          executionTime: Math.random() * 1000 + 500,
          result: {
            status: 'completed',
            message: `Command "${data.command}" executed successfully`,
          },
        }
        
        // 广播设备状态更新
        io.to(`device:${data.deviceId}`).emit('device:control:update', {
          deviceId: data.deviceId,
          command: data.command,
          parameters: data.parameters,
          executedBy: socket.data.username,
          timestamp: Date.now(),
        })
        
        callback(response)
      } catch (error: any) {
        logger.error('Device control error:', error)
        callback({
          success: false,
          error: error.message || 'Control command failed',
        })
      }
    })
    
    // 处理数据查询请求
    socket.on('data:query', async (query: {
      deviceId: string
      metrics: string[]
      timeRange?: { start: Date; end: Date }
    }, callback) => {
      try {
        // 模拟历史数据查询
        const mockData = query.metrics.map(metric => ({
          metric,
          data: generateMockHistoricalData(query.deviceId, metric, query.timeRange),
        }))
        
        callback({
          success: true,
          data: mockData,
        })
      } catch (error: any) {
        callback({
          success: false,
          error: error.message,
        })
      }
    })
    
    // 处理模拟器控制命令（仅用于开发）
    socket.on('simulator:command', (command: string, params: any) => {
      if (process.env.NODE_ENV === 'development') {
        dataSimulator?.handleClientCommand(command, params)
        socket.emit('simulator:response', {
          command,
          success: true,
          message: `Command ${command} executed`,
        })
      }
    })
    
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`)
    })
  })
  
  logger.info('Socket.IO initialized with data simulator')
}

// 生成模拟历史数据
function generateMockHistoricalData(
  deviceId: string,
  metric: string,
  timeRange?: { start: Date; end: Date }
) {
  const now = Date.now()
  const start = timeRange?.start?.getTime() || now - 24 * 60 * 60 * 1000 // 默认24小时
  const end = timeRange?.end?.getTime() || now
  const interval = 5 * 60 * 1000 // 5分钟间隔
  
  const data = []
  let baseValue = 50
  
  // 根据指标设置基础值
  switch (metric) {
    case 'temperature':
      baseValue = 75
      break
    case 'pressure':
      baseValue = 3.2
      break
    case 'flow':
      baseValue = 125
      break
    case 'rpm':
      baseValue = 1500
      break
  }
  
  for (let time = start; time <= end; time += interval) {
    const value = baseValue + (Math.random() - 0.5) * baseValue * 0.1
    data.push({
      timestamp: time,
      value: Number(value.toFixed(2)),
    })
  }
  
  return data
}

// 导出数据模拟器实例供其他模块使用
export { dataSimulator }