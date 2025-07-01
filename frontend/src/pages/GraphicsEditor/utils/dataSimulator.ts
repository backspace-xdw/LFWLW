// 模拟设备数据生成器
export class DataSimulator {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, (data: any) => void> = new Map();

  // 设备数据模板
  private deviceTemplates = {
    pump: {
      status: ['stopped', 'running', 'fault'],
      flow: { min: 0, max: 200, unit: 'm³/h' },
      pressure: { min: 0, max: 10, unit: 'bar' },
      temperature: { min: 20, max: 80, unit: '°C' },
      speed: { min: 0, max: 3000, unit: 'rpm' },
      current: { min: 0, max: 50, unit: 'A' },
    },
    valve: {
      position: { min: 0, max: 100, unit: '%' },
      status: ['closed', 'open', 'moving', 'fault'],
    },
    tank: {
      level: { min: 0, max: 100, unit: '%' },
      temperature: { min: 0, max: 100, unit: '°C' },
      pressure: { min: 0, max: 5, unit: 'bar' },
    },
    motor: {
      status: ['stopped', 'running', 'fault'],
      speed: { min: 0, max: 1500, unit: 'rpm' },
      current: { min: 0, max: 100, unit: 'A' },
      power: { min: 0, max: 50, unit: 'kW' },
      temperature: { min: 20, max: 120, unit: '°C' },
    },
  };

  // 开始模拟设备数据
  startSimulation(deviceId: string, deviceType: string, interval: number = 1000) {
    // 停止之前的模拟
    this.stopSimulation(deviceId);

    const template = this.deviceTemplates[deviceType as keyof typeof this.deviceTemplates];
    if (!template) return;

    // 创建初始状态
    const deviceState: any = {};
    
    // 初始化数值
    Object.entries(template).forEach(([key, config]) => {
      if (Array.isArray(config)) {
        deviceState[key] = config[0];
      } else if (typeof config === 'object' && 'min' in config) {
        deviceState[key] = config.min;
      }
    });

    // 开始定时更新
    const timer = setInterval(() => {
      const data = this.generateData(deviceType, deviceState);
      
      // 更新状态
      Object.assign(deviceState, data);
      
      // 通知订阅者
      const subscriber = this.subscribers.get(deviceId);
      if (subscriber) {
        subscriber({
          deviceId,
          timestamp: Date.now(),
          data,
        });
      }
    }, interval);

    this.intervals.set(deviceId, timer);
  }

  // 停止模拟
  stopSimulation(deviceId: string) {
    const timer = this.intervals.get(deviceId);
    if (timer) {
      clearInterval(timer);
      this.intervals.delete(deviceId);
    }
  }

  // 订阅设备数据
  subscribe(deviceId: string, callback: (data: any) => void) {
    this.subscribers.set(deviceId, callback);
  }

  // 取消订阅
  unsubscribe(deviceId: string) {
    this.subscribers.delete(deviceId);
  }

  // 生成模拟数据
  private generateData(deviceType: string, currentState: any): any {
    const template = this.deviceTemplates[deviceType as keyof typeof this.deviceTemplates];
    if (!template) return {};

    const data: any = {};

    switch (deviceType) {
      case 'pump':
        // 泵的数据模拟
        if (currentState.status === 'running') {
          data.flow = this.fluctuate(100, 20);
          data.pressure = this.fluctuate(5, 1);
          data.temperature = this.fluctuate(50, 5);
          data.speed = this.fluctuate(1500, 100);
          data.current = this.fluctuate(25, 5);
        } else {
          data.flow = 0;
          data.pressure = 0;
          data.speed = 0;
          data.current = 0;
          data.temperature = this.fluctuate(25, 2);
        }
        
        // 随机改变状态
        if (Math.random() < 0.05) {
          data.status = this.randomChoice(['stopped', 'running', 'fault']);
        }
        break;

      case 'valve':
        // 阀门数据模拟
        if (currentState.status === 'open') {
          data.position = this.fluctuate(100, 5);
        } else if (currentState.status === 'closed') {
          data.position = 0;
        } else if (currentState.status === 'moving') {
          data.position = Math.min(100, Math.max(0, currentState.position + this.randomRange(-10, 10)));
        }
        
        // 随机改变状态
        if (Math.random() < 0.02) {
          data.status = this.randomChoice(['closed', 'open', 'moving']);
        }
        break;

      case 'tank':
        // 储罐数据模拟
        data.level = Math.max(0, Math.min(100, currentState.level + this.randomRange(-2, 2)));
        data.temperature = this.fluctuate(currentState.temperature, 1);
        data.pressure = this.fluctuate(2.5, 0.5);
        break;

      case 'motor':
        // 电机数据模拟
        if (currentState.status === 'running') {
          data.speed = this.fluctuate(1450, 50);
          data.current = this.fluctuate(45, 5);
          data.power = this.fluctuate(15, 2);
          data.temperature = Math.min(120, currentState.temperature + this.randomRange(0, 2));
        } else {
          data.speed = 0;
          data.current = 0;
          data.power = 0;
          data.temperature = Math.max(20, currentState.temperature - 1);
        }
        
        // 随机改变状态
        if (Math.random() < 0.03) {
          data.status = this.randomChoice(['stopped', 'running']);
        }
        break;
    }

    return data;
  }

  // 在中心值附近波动
  private fluctuate(center: number, range: number): number {
    return center + (Math.random() - 0.5) * 2 * range;
  }

  // 随机范围
  private randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // 随机选择
  private randomChoice<T>(choices: T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  // 清理所有模拟
  dispose() {
    this.intervals.forEach(timer => clearInterval(timer));
    this.intervals.clear();
    this.subscribers.clear();
  }
}

// 创建全局实例
export const dataSimulator = new DataSimulator();