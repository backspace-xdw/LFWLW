import { EventEmitter } from 'events'

export interface DeviceSignal {
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

export interface SignalConfig {
  baseValue: number
  amplitude: number
  frequency: number
  noise: number
  trend?: number
}

export class SignalGenerator extends EventEmitter {
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private configs: Map<string, Record<string, SignalConfig>> = new Map()
  private latestData: Map<string, DeviceSignal> = new Map()
  
  constructor() {
    super()
    this.initializeDeviceConfigs()
  }

  private initializeDeviceConfigs() {
    // 离心泵配置
    this.configs.set('PUMP_001', {
      temperature: { baseValue: 75, amplitude: 5, frequency: 0.1, noise: 2 },
      pressure: { baseValue: 3.2, amplitude: 0.3, frequency: 0.2, noise: 0.1 },
      flow: { baseValue: 125, amplitude: 10, frequency: 0.15, noise: 5 },
      rpm: { baseValue: 1500, amplitude: 50, frequency: 0.05, noise: 20 },
      vibration: { baseValue: 0.5, amplitude: 0.2, frequency: 0.3, noise: 0.1 },
    })

    // 电动阀门配置
    this.configs.set('VALVE_002', {
      temperature: { baseValue: 25, amplitude: 2, frequency: 0.05, noise: 1 },
      pressure: { baseValue: 2.5, amplitude: 0.2, frequency: 0.1, noise: 0.05 },
      position: { baseValue: 75, amplitude: 0, frequency: 0, noise: 0 }, // 阀门开度
    })

    // 温度传感器配置
    this.configs.set('SENSOR_003', {
      temperature: { baseValue: 25, amplitude: 10, frequency: 0.02, noise: 0.5, trend: 0.01 },
      humidity: { baseValue: 60, amplitude: 5, frequency: 0.03, noise: 2 },
    })

    // 三相电机配置
    this.configs.set('MOTOR_004', {
      temperature: { baseValue: 65, amplitude: 8, frequency: 0.08, noise: 3 },
      voltage: { baseValue: 380, amplitude: 5, frequency: 0.5, noise: 2 },
      current: { baseValue: 30, amplitude: 2, frequency: 0.4, noise: 1 },
      power: { baseValue: 15, amplitude: 1, frequency: 0.1, noise: 0.5 },
      rpm: { baseValue: 2980, amplitude: 20, frequency: 0.05, noise: 10 },
    })

    // 储罐配置
    this.configs.set('TANK_005', {
      temperature: { baseValue: 20, amplitude: 1, frequency: 0.01, noise: 0.5 },
      level: { baseValue: 60, amplitude: 10, frequency: 0.005, noise: 2, trend: -0.05 },
      pressure: { baseValue: 1.0, amplitude: 0.1, frequency: 0.02, noise: 0.02 },
    })
  }

  // 生成信号值
  private generateSignalValue(config: SignalConfig, time: number): number {
    const { baseValue, amplitude, frequency, noise, trend = 0 } = config
    
    // 正弦波信号
    const sineWave = amplitude * Math.sin(2 * Math.PI * frequency * time)
    
    // 随机噪声
    const randomNoise = (Math.random() - 0.5) * 2 * noise
    
    // 趋势项
    const trendValue = trend * time
    
    // 组合信号
    let value = baseValue + sineWave + randomNoise + trendValue
    
    // 添加偶尔的异常值
    if (Math.random() < 0.02) {
      value += (Math.random() - 0.5) * amplitude * 3
    }
    
    return Number(value.toFixed(2))
  }

  // 启动设备数据生成
  startDevice(deviceId: string, interval: number = 1000) {
    if (this.timers.has(deviceId)) {
      console.log(`Device ${deviceId} is already running`)
      return
    }

    const deviceConfig = this.configs.get(deviceId)
    if (!deviceConfig) {
      console.error(`No configuration found for device ${deviceId}`)
      return
    }

    let timeOffset = 0
    const timer = setInterval(() => {
      const data: any = {}
      
      // 生成各个参数的数据
      Object.entries(deviceConfig).forEach(([key, config]) => {
        data[key] = this.generateSignalValue(config, timeOffset)
      })

      const signal: DeviceSignal = {
        deviceId,
        timestamp: Date.now(),
        data,
      }

      // 缓存最新数据
      this.latestData.set(deviceId, signal)

      // 发送数据事件
      this.emit('data', signal)
      this.emit(`device:${deviceId}`, signal)

      timeOffset += interval / 1000
    }, interval)

    this.timers.set(deviceId, timer)
    console.log(`Started signal generation for device ${deviceId}`)
  }

  // 停止设备数据生成
  stopDevice(deviceId: string) {
    const timer = this.timers.get(deviceId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(deviceId)
      console.log(`Stopped signal generation for device ${deviceId}`)
    }
  }

  // 停止所有设备
  stopAll() {
    this.timers.forEach((timer, deviceId) => {
      clearInterval(timer)
      console.log(`Stopped signal generation for device ${deviceId}`)
    })
    this.timers.clear()
  }

  // 更新设备配置
  updateDeviceConfig(deviceId: string, parameterConfigs: Record<string, SignalConfig>) {
    const existingConfig = this.configs.get(deviceId) || {}
    this.configs.set(deviceId, { ...existingConfig, ...parameterConfigs })
  }

  // 模拟设备故障
  simulateFault(deviceId: string, parameter: string, faultValue: number, duration: number = 5000) {
    const deviceConfig = this.configs.get(deviceId)
    if (!deviceConfig || !deviceConfig[parameter]) {
      console.error(`Invalid device or parameter: ${deviceId}/${parameter}`)
      return
    }

    const originalConfig = { ...deviceConfig[parameter] }
    
    // 设置故障值
    deviceConfig[parameter] = {
      baseValue: faultValue,
      amplitude: originalConfig.amplitude * 2,
      frequency: originalConfig.frequency * 3,
      noise: originalConfig.noise * 5,
    }

    // 恢复正常
    setTimeout(() => {
      if (this.configs.get(deviceId)) {
        deviceConfig[parameter] = originalConfig
        console.log(`Device ${deviceId} parameter ${parameter} recovered from fault`)
      }
    }, duration)

    console.log(`Simulated fault for device ${deviceId} parameter ${parameter}`)
  }

  // 获取当前设备状态
  getDeviceStatus(deviceId: string): any {
    const deviceConfig = this.configs.get(deviceId)
    if (!deviceConfig) return null

    const data: any = {}
    const timeOffset = Date.now() / 1000

    Object.entries(deviceConfig).forEach(([key, config]) => {
      data[key] = this.generateSignalValue(config, timeOffset)
    })

    return {
      deviceId,
      timestamp: Date.now(),
      data,
    }
  }

  // 获取设备最新数据
  getLatestData(deviceId: string): DeviceSignal | null {
    return this.latestData.get(deviceId) || this.getDeviceStatus(deviceId)
  }

  // 获取设备参数名列表
  getDeviceParameterNames(deviceId: string): string[] {
    const cfg = this.configs.get(deviceId)
    return cfg ? Object.keys(cfg) : []
  }

  // 获取所有已配置的设备ID
  getConfiguredDeviceIds(): string[] {
    return Array.from(this.configs.keys())
  }
}

// 单例实例
export const signalGenerator = new SignalGenerator()