import { Server } from 'socket.io'
import { signalGenerator, DeviceSignal } from './signalGenerator'
import { logger } from '../utils/logger'

export class DataSimulator {
  private io: Server
  private activeDevices: Set<string> = new Set([
    'PUMP_001',
    'VALVE_002',
    'SENSOR_003',
    'MOTOR_004',
    'TANK_005',
  ])

  constructor(io: Server) {
    this.io = io
    this.setupSignalHandlers()
  }

  // 导出信号生成器供外部使用
  get signalGenerator() {
    return signalGenerator
  }

  private setupSignalHandlers() {
    // 监听信号生成器的数据事件
    signalGenerator.on('data', (signal: DeviceSignal) => {
      // 广播到订阅该设备的客户端
      this.io.to(`device:${signal.deviceId}`).emit('device:data', signal)
      
      // 广播到监控大屏
      this.io.to('monitor:realtime').emit('realtime:data', signal)
      
      // 检查告警条件
      this.checkAlarmConditions(signal)
    })
  }

  // 启动模拟器
  start() {
    logger.info('Starting data simulator...')
    
    // 启动所有活动设备的数据生成
    this.activeDevices.forEach(deviceId => {
      const interval = this.getDeviceInterval(deviceId)
      signalGenerator.startDevice(deviceId, interval)
    })

    // 定期模拟一些异常情况
    this.scheduleRandomEvents()
  }

  // 停止模拟器
  stop() {
    logger.info('Stopping data simulator...')
    signalGenerator.stopAll()
  }

  // 获取设备数据更新间隔
  private getDeviceInterval(deviceId: string): number {
    const intervals: Record<string, number> = {
      'PUMP_001': 1000,      // 泵 - 1秒
      'VALVE_002': 2000,     // 阀门 - 2秒
      'SENSOR_003': 5000,    // 传感器 - 5秒
      'MOTOR_004': 1000,     // 电机 - 1秒
      'TANK_005': 10000,     // 储罐 - 10秒
    }
    return intervals[deviceId] || 5000
  }

  // 检查告警条件
  private checkAlarmConditions(signal: DeviceSignal) {
    const { deviceId, data } = signal
    const alarms: any[] = []

    // 温度告警检查
    if (data.temperature !== undefined) {
      if (data.temperature > 85) {
        alarms.push({
          deviceId,
          type: 'temperature_high',
          severity: 'critical',
          value: data.temperature,
          threshold: 85,
          message: `设备 ${deviceId} 温度过高: ${data.temperature}°C`,
        })
      } else if (data.temperature > 80) {
        alarms.push({
          deviceId,
          type: 'temperature_warning',
          severity: 'warning',
          value: data.temperature,
          threshold: 80,
          message: `设备 ${deviceId} 温度警告: ${data.temperature}°C`,
        })
      }
    }

    // 压力告警检查
    if (data.pressure !== undefined) {
      if (data.pressure > 4.5) {
        alarms.push({
          deviceId,
          type: 'pressure_high',
          severity: 'high',
          value: data.pressure,
          threshold: 4.5,
          message: `设备 ${deviceId} 压力过高: ${data.pressure} bar`,
        })
      }
    }

    // 振动告警检查
    if (data.vibration !== undefined && data.vibration > 1.0) {
      alarms.push({
        deviceId,
        type: 'vibration_high',
        severity: 'warning',
        value: data.vibration,
        threshold: 1.0,
        message: `设备 ${deviceId} 振动异常: ${data.vibration}`,
      })
    }

    // 液位告警检查
    if (data.level !== undefined) {
      if (data.level < 20) {
        alarms.push({
          deviceId,
          type: 'level_low',
          severity: 'warning',
          value: data.level,
          threshold: 20,
          message: `设备 ${deviceId} 液位过低: ${data.level}%`,
        })
      } else if (data.level > 90) {
        alarms.push({
          deviceId,
          type: 'level_high',
          severity: 'warning',
          value: data.level,
          threshold: 90,
          message: `设备 ${deviceId} 液位过高: ${data.level}%`,
        })
      }
    }

    // 发送告警
    alarms.forEach(alarm => {
      this.io.emit('alarm:new', {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...alarm,
        timestamp: signal.timestamp,
      })
    })
  }

  // 定期模拟随机事件
  private scheduleRandomEvents() {
    // 每30秒随机触发一次故障
    setInterval(() => {
      if (Math.random() < 0.3) {
        const devices = Array.from(this.activeDevices)
        const randomDevice = devices[Math.floor(Math.random() * devices.length)]
        
        // 模拟温度异常
        if (Math.random() < 0.5) {
          logger.info(`Simulating temperature fault for device ${randomDevice}`)
          signalGenerator.simulateFault(randomDevice, 'temperature', 95, 10000)
        } else {
          // 模拟压力异常
          logger.info(`Simulating pressure fault for device ${randomDevice}`)
          signalGenerator.simulateFault(randomDevice, 'pressure', 5.0, 8000)
        }
      }
    }, 30000)

    // 每分钟更新一次设备在线状态
    setInterval(() => {
      const statusUpdate = Array.from(this.activeDevices).map(deviceId => ({
        deviceId,
        status: Math.random() > 0.95 ? 'offline' : 'online',
        lastSeen: Date.now(),
      }))
      
      this.io.emit('device:status', statusUpdate)
    }, 60000)
  }

  // 处理客户端命令
  handleClientCommand(command: string, params: any) {
    switch (command) {
      case 'start_device':
        if (params.deviceId) {
          signalGenerator.startDevice(params.deviceId, params.interval || 1000)
          this.activeDevices.add(params.deviceId)
        }
        break
        
      case 'stop_device':
        if (params.deviceId) {
          signalGenerator.stopDevice(params.deviceId)
          this.activeDevices.delete(params.deviceId)
        }
        break
        
      case 'simulate_fault':
        if (params.deviceId && params.parameter) {
          signalGenerator.simulateFault(
            params.deviceId,
            params.parameter,
            params.value,
            params.duration
          )
        }
        break
        
      case 'update_config':
        if (params.deviceId && params.config) {
          signalGenerator.updateDeviceConfig(params.deviceId, params.config)
        }
        break
    }
  }
}

export default DataSimulator