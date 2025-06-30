import { request } from '@/utils/request'

export interface Device {
  id: string
  deviceId: string
  name: string
  type: DeviceType
  model: string
  status: 'online' | 'offline' | 'maintenance' | 'fault'
  location: Location
  group?: DeviceGroup
  lastOnlineAt?: string
  properties: Record<string, any>
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface DeviceType {
  id: string
  name: string
  displayName: string
  category: string
  iconUrl?: string
}

export interface DeviceGroup {
  id: string
  name: string
  parentId?: string
  description?: string
}

export interface Location {
  latitude?: number
  longitude?: number
  address?: string
  building?: string
  floor?: string
  area?: string
}

export interface DeviceListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  typeId?: string
  groupId?: string
  orgId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateDeviceData {
  deviceId: string
  name: string
  typeId: string
  model?: string
  manufacturer?: string
  serialNumber?: string
  location?: Location
  groupId?: string
  properties?: Record<string, any>
  metadata?: Record<string, any>
}

export interface DeviceControlData {
  command: string
  parameters?: Record<string, any>
  timeout?: number
}

export const deviceService = {
  // 获取设备列表
  getDeviceList: async (params: DeviceListParams) => {
    return request.get('/api/v1/devices', { params })
  },

  // 获取设备详情
  getDevice: async (deviceId: string) => {
    return request.get(`/api/v1/devices/${deviceId}`)
  },

  // 创建设备
  createDevice: async (data: CreateDeviceData) => {
    return request.post('/api/v1/devices', data)
  },

  // 更新设备
  updateDevice: async (deviceId: string, data: Partial<CreateDeviceData>) => {
    return request.put(`/api/v1/devices/${deviceId}`, data)
  },

  // 删除设备
  deleteDevice: async (deviceId: string) => {
    return request.delete(`/api/v1/devices/${deviceId}`)
  },

  // 设备控制
  controlDevice: async (deviceId: string, data: DeviceControlData) => {
    return request.post(`/api/v1/devices/${deviceId}/control`, data)
  },

  // 获取设备配置
  getDeviceConfig: async (deviceId: string) => {
    return request.get(`/api/v1/devices/${deviceId}/config`)
  },

  // 更新设备配置
  updateDeviceConfig: async (deviceId: string, configs: any[]) => {
    return request.put(`/api/v1/devices/${deviceId}/config`, { configs })
  },

  // 获取设备统计
  getDeviceStatistics: async () => {
    return request.get('/api/v1/devices/statistics')
  },
}