import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth'

export interface DeviceData {
  deviceId: string
  timestamp: number
  data: {
    temperature?: number
    pressure?: number
    flow?: number
    rpm?: number
    voltage?: number
    current?: number
    power?: number
    level?: number
    vibration?: number
    humidity?: number
  }
}

export interface AlarmData {
  id: string
  deviceId: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  value: number
  threshold: number
  message: string
  timestamp: number
}

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect() {
    if (this.socket?.connected) {
      return this.socket
    }

    const { token } = useAuthStore.getState()
    
    // 使用相对路径，通过代理连接
    const wsUrl = import.meta.env.VITE_WS_URL || ''
    
    this.socket = io(wsUrl, {
      path: '/socket.io/',
      auth: {
        token,
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.setupEventHandlers()
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.emit('connected', true)
      // 重新订阅
      console.log('重新订阅监控数据...')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
      this.emit('connected', false)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
      if (error.message === 'Authentication failed') {
        // Token过期，重新登录
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    })

    // 设备数据事件
    this.socket.on('device:data', (data: DeviceData) => {
      this.emit('device:data', data)
      this.emit(`device:${data.deviceId}`, data)
    })

    // 实时监控数据
    this.socket.on('realtime:data', (data: DeviceData) => {
      this.emit('realtime:data', data)
    })

    // 告警事件
    this.socket.on('alarm:new', (alarm: AlarmData) => {
      this.emit('alarm:new', alarm)
      this.emit(`alarm:${alarm.severity}`, alarm)
    })

    // 设备状态更新
    this.socket.on('device:status', (statusList: any[]) => {
      this.emit('device:status', statusList)
    })

    // 设备控制更新
    this.socket.on('device:control:update', (update: any) => {
      this.emit('device:control:update', update)
    })
  }

  // 订阅设备数据
  subscribeDevice(deviceIds: string[]) {
    if (!this.socket) {
      console.error('Socket not connected')
      return
    }
    this.socket.emit('subscribe:device', deviceIds)
  }

  // 取消订阅设备数据
  unsubscribeDevice(deviceIds: string[]) {
    if (!this.socket) return
    this.socket.emit('unsubscribe:device', deviceIds)
  }

  // 订阅实时监控
  subscribeMonitor() {
    if (!this.socket) return
    this.socket.emit('subscribe:monitor')
  }

  // 订阅告警
  subscribeAlarms(severity?: string[]) {
    if (!this.socket) return
    this.socket.emit('subscribe:alarms', { severity })
  }

  // 发送设备控制命令
  async controlDevice(deviceId: string, command: string, parameters?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit('device:control', { deviceId, command, parameters }, (response: any) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.error || 'Control command failed'))
        }
      })
    })
  }

  // 查询历史数据
  async queryData(deviceId: string, metrics: string[], timeRange?: { start: Date; end: Date }): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit('data:query', { deviceId, metrics, timeRange }, (response: any) => {
        if (response.success) {
          resolve(response.data)
        } else {
          reject(new Error(response.error || 'Data query failed'))
        }
      })
    })
  }

  // 模拟器控制（开发环境）
  simulatorCommand(command: string, params: any) {
    if (!this.socket) return
    this.socket.emit('simulator:command', command, params)
  }

  // 事件监听管理
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  private emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }
}

// 单例实例
export const socketService = new SocketService()

// React Hook
export function useSocket() {
  return socketService
}