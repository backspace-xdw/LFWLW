// 设备模型
export interface Device {
  id: string
  name: string
  type: string
  status: 'online' | 'offline'
  location?: string
  createdAt: Date
  updatedAt: Date
}

// 模拟设备数据
const devices: Device[] = [
  {
    id: 'PUMP_001',
    name: '主循环泵',
    type: 'pump',
    status: 'online',
    location: '生产车间A',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'VALVE_002',
    name: '进料阀',
    type: 'valve',
    status: 'online',
    location: '生产车间A',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'SENSOR_003',
    name: '温度传感器',
    type: 'sensor',
    status: 'online',
    location: '生产车间B',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'MOTOR_004',
    name: '驱动电机',
    type: 'motor',
    status: 'online',
    location: '生产车间B',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'TANK_005',
    name: '储罐',
    type: 'tank',
    status: 'online',
    location: '储罐区',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
]

// 获取所有设备
export async function getDevices(): Promise<Device[]> {
  return devices
}

// 获取单个设备
export async function getDevice(id: string): Promise<Device | undefined> {
  return devices.find(d => d.id === id)
}

// 更新设备状态
export async function updateDeviceStatus(id: string, status: 'online' | 'offline'): Promise<void> {
  const device = devices.find(d => d.id === id)
  if (device) {
    device.status = status
    device.updatedAt = new Date()
  }
}