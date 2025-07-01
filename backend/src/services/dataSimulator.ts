import { Server } from 'socket.io'
import { signalGenerator, DeviceSignal } from './signalGenerator'
import { logger } from '../utils/logger'
import { alarmRuleManager } from './alarmRules'

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
    const { deviceId, data, timestamp } = signal
    
    // 使用告警规则管理器检查每个参数
    Object.entries(data).forEach(([parameter, value]) => {
      if (typeof value === 'number') {
        const alarms = alarmRuleManager.checkAlarms(deviceId, parameter, value, timestamp)
        
        // 发送告警
        alarms.forEach(alarm => {
          // 发送到所有订阅告警的客户端
          this.io.to('alarms:all').emit('alarm:new', alarm)
          
          // 根据严重级别发送
          this.io.to(`alarms:${alarm.severity}`).emit('alarm:new', alarm)
          
          // 记录告警日志
          logger.info(`New alarm: ${alarm.severity} - ${alarm.message}`)
        })
      }
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

    // 模拟车辆位置更新（每5秒）
    this.startVehicleSimulation()
  }

  // 模拟车辆位置数据
  private startVehicleSimulation() {
    const vehicles = [
      { 
        id: 'v1', 
        lng: 116.404, 
        lat: 39.915, 
        speed: 45,
        baseSpeed: 45,
        direction: 90 
      },
      { 
        id: 'v2', 
        lng: 116.407, 
        lat: 39.904, 
        speed: 0,
        baseSpeed: 0,
        direction: 180 
      }
    ]
    
    setInterval(() => {
      vehicles.forEach(vehicle => {
        // 随机移动车辆位置
        if (vehicle.baseSpeed > 0) {
          // 模拟车辆移动
          const speedVariation = (Math.random() - 0.5) * 10
          vehicle.speed = Math.max(0, vehicle.baseSpeed + speedVariation)
          
          if (vehicle.speed > 0) {
            // 根据方向移动
            const distance = vehicle.speed / 3600 / 200 // 简化的距离计算
            const directionRad = (vehicle.direction * Math.PI) / 180
            
            vehicle.lng += distance * Math.cos(directionRad)
            vehicle.lat += distance * Math.sin(directionRad)
            
            // 随机改变方向
            vehicle.direction = (vehicle.direction + (Math.random() - 0.5) * 10 + 360) % 360
          }
        }
        
        const locationData = {
          vehicleId: vehicle.id,
          location: {
            longitude: vehicle.lng,
            latitude: vehicle.lat,
            speed: Math.round(vehicle.speed),
            direction: Math.round(vehicle.direction),
            updateTime: new Date().toISOString()
          }
        }
        
        // 发送车辆位置更新
        this.io.emit('vehicle-location', locationData)
        logger.info(`Vehicle ${vehicle.id} location update: ${vehicle.lng.toFixed(6)}, ${vehicle.lat.toFixed(6)}`)
      })
    }, 5000)
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