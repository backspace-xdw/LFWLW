export interface AlarmRule {
  id: string
  name: string
  deviceId: string
  deviceName: string
  parameter: string
  type: 'HH' | 'H' | 'L' | 'LL' | 'ROC' | 'DEVIATION'
  enabled: boolean
  value: number
  unit: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  delay?: number // 延迟时间（秒）
  deadband?: number // 死区
  rocPeriod?: number // 变化率计算周期（分钟）
  description?: string
}

// 默认告警规则
export const defaultAlarmRules: AlarmRule[] = [
  // PUMP_001 规则
  {
    id: 'rule_001',
    name: '主泵温度高高报警',
    deviceId: 'PUMP_001',
    deviceName: '主循环泵',
    parameter: 'temperature',
    type: 'HH',
    enabled: true,
    value: 90,
    unit: '°C',
    severity: 'critical',
    delay: 5,
    deadband: 2,
    description: '温度超过90°C时触发严重告警',
  },
  {
    id: 'rule_002',
    name: '主泵温度高报警',
    deviceId: 'PUMP_001',
    deviceName: '主循环泵',
    parameter: 'temperature',
    type: 'H',
    enabled: true,
    value: 80,
    unit: '°C',
    severity: 'high',
    delay: 10,
    deadband: 1,
    description: '温度超过80°C时触发高级告警',
  },
  {
    id: 'rule_003',
    name: '主泵温度低报警',
    deviceId: 'PUMP_001',
    deviceName: '主循环泵',
    parameter: 'temperature',
    type: 'L',
    enabled: true,
    value: 10,
    unit: '°C',
    severity: 'medium',
    delay: 30,
    deadband: 2,
    description: '温度低于10°C时触发中级告警',
  },
  {
    id: 'rule_004',
    name: '主泵压力高高报警',
    deviceId: 'PUMP_001',
    deviceName: '主循环泵',
    parameter: 'pressure',
    type: 'HH',
    enabled: true,
    value: 5.0,
    unit: 'bar',
    severity: 'critical',
    delay: 5,
    deadband: 0.1,
  },
  {
    id: 'rule_005',
    name: '主泵压力高报警',
    deviceId: 'PUMP_001',
    deviceName: '主循环泵',
    parameter: 'pressure',
    type: 'H',
    enabled: true,
    value: 4.5,
    unit: 'bar',
    severity: 'high',
    delay: 10,
    deadband: 0.1,
  },
  {
    id: 'rule_006',
    name: '主泵流量变化率报警',
    deviceId: 'PUMP_001',
    deviceName: '主循环泵',
    parameter: 'flow',
    type: 'ROC',
    enabled: true,
    value: 10,
    unit: 'm³/h/min',
    severity: 'medium',
    rocPeriod: 1,
    description: '流量变化率超过10m³/h/min时触发',
  },
  
  // VALVE_002 规则
  {
    id: 'rule_007',
    name: '阀门温度高报警',
    deviceId: 'VALVE_002',
    deviceName: '进料阀门',
    parameter: 'temperature',
    type: 'H',
    enabled: true,
    value: 85,
    unit: '°C',
    severity: 'high',
    delay: 10,
    deadband: 2,
  },
  {
    id: 'rule_008',
    name: '阀门开度低低报警',
    deviceId: 'VALVE_002',
    deviceName: '进料阀门',
    parameter: 'opening',
    type: 'LL',
    enabled: true,
    value: 5,
    unit: '%',
    severity: 'critical',
    delay: 5,
    deadband: 1,
  },
  
  // TANK_005 规则
  {
    id: 'rule_009',
    name: '储罐液位低报警',
    deviceId: 'TANK_005',
    deviceName: '储罐-5号',
    parameter: 'level',
    type: 'L',
    enabled: true,
    value: 20,
    unit: '%',
    severity: 'medium',
    delay: 30,
    deadband: 2,
    description: '液位低于20%时触发中级告警',
  },
  {
    id: 'rule_010',
    name: '储罐液位低低报警',
    deviceId: 'TANK_005',
    deviceName: '储罐-5号',
    parameter: 'level',
    type: 'LL',
    enabled: true,
    value: 10,
    unit: '%',
    severity: 'critical',
    delay: 10,
    deadband: 1,
    description: '液位低于10%时触发严重告警',
  },
  {
    id: 'rule_011',
    name: '储罐液位高报警',
    deviceId: 'TANK_005',
    deviceName: '储罐-5号',
    parameter: 'level',
    type: 'H',
    enabled: true,
    value: 90,
    unit: '%',
    severity: 'medium',
    delay: 30,
    deadband: 2,
    description: '液位高于90%时触发中级告警',
  },
  {
    id: 'rule_012',
    name: '储罐温度高高报警',
    deviceId: 'TANK_005',
    deviceName: '储罐-5号',
    parameter: 'temperature',
    type: 'HH',
    enabled: true,
    value: 95,
    unit: '°C',
    severity: 'critical',
    delay: 5,
    deadband: 2,
  },
  
  // MOTOR_004 规则
  {
    id: 'rule_013',
    name: '电机温度高报警',
    deviceId: 'MOTOR_004',
    deviceName: '驱动电机',
    parameter: 'temperature',
    type: 'H',
    enabled: true,
    value: 85,
    unit: '°C',
    severity: 'high',
    delay: 10,
    deadband: 2,
  },
  {
    id: 'rule_014',
    name: '电机电流高高报警',
    deviceId: 'MOTOR_004',
    deviceName: '驱动电机',
    parameter: 'current',
    type: 'HH',
    enabled: true,
    value: 20,
    unit: 'A',
    severity: 'critical',
    delay: 3,
    deadband: 0.5,
  },
  {
    id: 'rule_015',
    name: '电机转速变化率报警',
    deviceId: 'MOTOR_004',
    deviceName: '驱动电机',
    parameter: 'rpm',
    type: 'ROC',
    enabled: true,
    value: 500,
    unit: 'rpm/min',
    severity: 'medium',
    rocPeriod: 1,
    description: '转速变化率超过500rpm/min时触发',
  },
]

// 告警规则管理器
export class AlarmRuleManager {
  private rules: AlarmRule[] = []
  private delayTimers: Map<string, NodeJS.Timeout> = new Map()
  private activeAlarms: Map<string, any> = new Map()
  private historicalData: Map<string, { timestamp: number; value: number }[]> = new Map()

  constructor() {
    this.rules = [...defaultAlarmRules]
  }

  // 获取所有规则
  getAllRules(): AlarmRule[] {
    return this.rules
  }

  // 获取设备的规则
  getDeviceRules(deviceId: string): AlarmRule[] {
    return this.rules.filter(rule => rule.deviceId === deviceId && rule.enabled)
  }

  // 添加规则
  addRule(rule: AlarmRule): void {
    this.rules.push(rule)
  }

  // 更新规则
  updateRule(id: string, updates: Partial<AlarmRule>): void {
    const index = this.rules.findIndex(rule => rule.id === id)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates }
    }
  }

  // 删除规则
  deleteRule(id: string): void {
    this.rules = this.rules.filter(rule => rule.id !== id)
    // 清理相关的定时器
    if (this.delayTimers.has(id)) {
      clearTimeout(this.delayTimers.get(id)!)
      this.delayTimers.delete(id)
    }
  }

  // 检查告警条件
  checkAlarms(deviceId: string, parameter: string, value: number, timestamp: number): any[] {
    const alarms: any[] = []
    const rules = this.getDeviceRules(deviceId).filter(rule => rule.parameter === parameter)

    // 保存历史数据用于ROC计算
    const key = `${deviceId}-${parameter}`
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, [])
    }
    const history = this.historicalData.get(key)!
    history.push({ timestamp, value })
    // 保留最近的数据（最多60个点）
    if (history.length > 60) {
      history.shift()
    }

    for (const rule of rules) {
      const alarmKey = `${rule.id}-${deviceId}-${parameter}`
      let shouldTrigger = false
      let alarmValue = value

      switch (rule.type) {
        case 'HH':
          shouldTrigger = value > rule.value
          break
        case 'H':
          shouldTrigger = value > rule.value
          break
        case 'L':
          shouldTrigger = value < rule.value
          break
        case 'LL':
          shouldTrigger = value < rule.value
          break
        case 'ROC':
          // 计算变化率
          const roc = this.calculateRateOfChange(history, rule.rocPeriod || 1)
          if (roc !== null) {
            shouldTrigger = Math.abs(roc) > rule.value
            alarmValue = roc
          }
          break
        case 'DEVIATION':
          // 偏差告警（需要设定值，这里暂时跳过）
          break
      }

      // 检查死区
      if (this.activeAlarms.has(alarmKey)) {
        const activeAlarm = this.activeAlarms.get(alarmKey)
        const deadband = rule.deadband || 0
        
        // 对于高限告警，值需要低于阈值减去死区才能恢复
        if (rule.type === 'HH' || rule.type === 'H') {
          if (value < rule.value - deadband) {
            this.activeAlarms.delete(alarmKey)
            shouldTrigger = false
          } else {
            shouldTrigger = true // 在死区内保持告警
          }
        }
        // 对于低限告警，值需要高于阈值加上死区才能恢复
        else if (rule.type === 'LL' || rule.type === 'L') {
          if (value > rule.value + deadband) {
            this.activeAlarms.delete(alarmKey)
            shouldTrigger = false
          } else {
            shouldTrigger = true // 在死区内保持告警
          }
        }
      }

      if (shouldTrigger) {
        // 处理延迟
        if (rule.delay && rule.delay > 0) {
          if (!this.delayTimers.has(alarmKey)) {
            // 开始延迟计时
            this.delayTimers.set(alarmKey, setTimeout(() => {
              // 延迟时间到，触发告警
              const alarm = this.createAlarm(rule, deviceId, alarmValue, timestamp)
              this.activeAlarms.set(alarmKey, alarm)
              alarms.push(alarm)
              this.delayTimers.delete(alarmKey)
            }, rule.delay * 1000))
          }
        } else {
          // 立即触发告警
          if (!this.activeAlarms.has(alarmKey)) {
            const alarm = this.createAlarm(rule, deviceId, alarmValue, timestamp)
            this.activeAlarms.set(alarmKey, alarm)
            alarms.push(alarm)
          }
        }
      } else {
        // 清除延迟定时器
        if (this.delayTimers.has(alarmKey)) {
          clearTimeout(this.delayTimers.get(alarmKey)!)
          this.delayTimers.delete(alarmKey)
        }
      }
    }

    return alarms
  }

  // 计算变化率
  private calculateRateOfChange(history: { timestamp: number; value: number }[], periodMinutes: number): number | null {
    if (history.length < 2) return null

    const now = Date.now()
    const periodMs = periodMinutes * 60 * 1000
    const startTime = now - periodMs

    // 找到时间段内的数据
    const periodData = history.filter(d => d.timestamp >= startTime)
    if (periodData.length < 2) return null

    // 计算变化率 (最新值 - 最早值) / 时间间隔（分钟）
    const first = periodData[0]
    const last = periodData[periodData.length - 1]
    const timeDiffMinutes = (last.timestamp - first.timestamp) / 60000

    if (timeDiffMinutes === 0) return null

    return (last.value - first.value) / timeDiffMinutes
  }

  // 创建告警对象
  private createAlarm(rule: AlarmRule, deviceId: string, value: number, timestamp: number): any {
    const typeText = {
      'HH': '高高',
      'H': '高',
      'L': '低',
      'LL': '低低',
      'ROC': '变化率',
      'DEVIATION': '偏差',
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      deviceId,
      deviceName: rule.deviceName,
      type: `${rule.parameter}_${rule.type.toLowerCase()}`,
      severity: rule.severity,
      value,
      threshold: rule.value,
      message: `设备 ${rule.deviceName} ${rule.parameter}${typeText[rule.type]}告警: ${value.toFixed(2)}${rule.unit}`,
      timestamp,
    }
  }
}

// 导出单例
export const alarmRuleManager = new AlarmRuleManager()