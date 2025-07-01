import React, { useState, useEffect } from 'react'
import { Layout } from 'antd'
import VehicleTree from './components/VehicleTree'
import VehicleMap from './components/VehicleMap'
import styles from './index.module.scss'
import { useRealtimeData } from '@/hooks/useRealtimeData'

const { Sider, Content } = Layout

export interface Vehicle {
  id: string
  name: string
  plateNumber: string
  type: 'car' | 'truck' | 'bus' | 'other'
  status: 'online' | 'offline' | 'moving' | 'stopped'
  location: {
    longitude: number
    latitude: number
    speed?: number
    direction?: number
    updateTime: string
  }
  driver?: {
    name: string
    phone: string
  }
  groupId?: string
}

export interface VehicleGroup {
  id: string
  name: string
  parentId?: string
  children?: VehicleGroup[]
  vehicles?: Vehicle[]
}

const VehicleMonitor: React.FC = () => {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([116.397428, 39.90923])
  
  // 使用实时数据钩子
  const { data: realtimeData } = useRealtimeData('vehicle-location')

  useEffect(() => {
    // 模拟获取车辆分组数据
    fetchVehicleGroups()
    // 模拟获取车辆数据
    fetchVehicles()
  }, [])

  useEffect(() => {
    // 处理实时位置更新
    if (realtimeData) {
      updateVehicleLocation(realtimeData)
    }
  }, [realtimeData])

  const fetchVehicleGroups = async () => {
    // TODO: 调用后端API获取车辆分组
    const mockGroups: VehicleGroup[] = [
      {
        id: '1',
        name: '物流车队',
        children: [
          {
            id: '1-1',
            name: '城市配送',
            parentId: '1'
          },
          {
            id: '1-2',
            name: '长途运输',
            parentId: '1'
          }
        ]
      },
      {
        id: '2',
        name: '客运车辆',
        children: [
          {
            id: '2-1',
            name: '公交车',
            parentId: '2'
          },
          {
            id: '2-2',
            name: '旅游大巴',
            parentId: '2'
          }
        ]
      }
    ]
    setVehicleGroups(mockGroups)
  }

  const fetchVehicles = async () => {
    // TODO: 调用后端API获取车辆数据
    const mockVehicles: Vehicle[] = [
      {
        id: 'v1',
        name: '配送车001',
        plateNumber: '京A12345',
        type: 'truck',
        status: 'moving',
        location: {
          longitude: 116.404,
          latitude: 39.915,
          speed: 45,
          direction: 90,
          updateTime: new Date().toISOString()
        },
        driver: {
          name: '张师傅',
          phone: '13800138000'
        },
        groupId: '1-1'
      },
      {
        id: 'v2',
        name: '公交001路',
        plateNumber: '京B88888',
        type: 'bus',
        status: 'stopped',
        location: {
          longitude: 116.407,
          latitude: 39.904,
          speed: 0,
          direction: 180,
          updateTime: new Date().toISOString()
        },
        groupId: '2-1'
      }
    ]
    setVehicles(mockVehicles)
  }

  const updateVehicleLocation = (data: any) => {
    setVehicles(prev => 
      prev.map(vehicle => 
        vehicle.id === data.vehicleId
          ? {
              ...vehicle,
              location: {
                ...vehicle.location,
                ...data.location,
                updateTime: new Date().toISOString()
              }
            }
          : vehicle
      )
    )
  }

  const handleVehicleSelect = (selectedIds: string[]) => {
    setSelectedVehicles(selectedIds)
  }

  const handleVehicleLocate = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setMapCenter([vehicle.location.longitude, vehicle.location.latitude])
    }
  }

  return (
    <Layout className={styles.vehicleMonitor}>
      <Sider width={300} className={styles.sider}>
        <VehicleTree
          groups={vehicleGroups}
          vehicles={vehicles}
          selectedVehicles={selectedVehicles}
          onSelect={handleVehicleSelect}
          onLocate={handleVehicleLocate}
        />
      </Sider>
      <Content className={styles.content}>
        <VehicleMap
          vehicles={vehicles.filter(v => selectedVehicles.includes(v.id))}
          center={mapCenter}
          onVehicleClick={(vehicleId) => {
            console.log('Vehicle clicked:', vehicleId)
          }}
        />
      </Content>
    </Layout>
  )
}

export default VehicleMonitor