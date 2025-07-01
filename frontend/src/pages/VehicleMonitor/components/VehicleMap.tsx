import React, { useEffect, useRef, useState } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { message, Spin } from 'antd'
import { Vehicle } from '../index'
import { AMAP_CONFIG, MAP_DEFAULT_CONFIG } from '@/config/map'
import styles from './VehicleMap.module.scss'

interface VehicleMapProps {
  vehicles: Vehicle[]
  center: [number, number]
  onVehicleClick?: (vehicleId: string) => void
}

const VehicleMap: React.FC<VehicleMapProps> = ({
  vehicles,
  center,
  onVehicleClick
}) => {
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const markerClustererRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)

  // 初始化地图
  useEffect(() => {
    AMapLoader.load(AMAP_CONFIG).then((AMap) => {
      if (!mapRef.current) return

      // 创建地图实例
      const map = new AMap.Map(mapRef.current, {
        ...MAP_DEFAULT_CONFIG,
        center: center
      })

      mapInstanceRef.current = map

      // 添加地图控件
      map.addControl(new AMap.Scale())
      map.addControl(new AMap.ToolBar())
      
      setLoading(false)
    }).catch((e) => {
      console.error('地图加载失败:', e)
      message.error('地图加载失败，请检查网络连接')
      setLoading(false)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
      }
    }
  }, [])

  // 更新地图中心点
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center)
    }
  }, [center])

  // 更新车辆标记
  useEffect(() => {
    if (!mapInstanceRef.current || !window.AMap) return

    // 清除旧标记
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current.clear()

    // 清除聚合
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers()
    }

    // 创建新标记
    const markers: any[] = []
    
    vehicles.forEach(vehicle => {
      // 创建自定义图标
      const icon = new window.AMap.Icon({
        size: new window.AMap.Size(32, 32),
        image: getVehicleIcon(vehicle),
        imageSize: new window.AMap.Size(32, 32)
      })

      // 创建标记
      const marker = new window.AMap.Marker({
        position: [vehicle.location.longitude, vehicle.location.latitude],
        icon: icon,
        offset: new window.AMap.Pixel(-16, -32),
        title: vehicle.name,
        extData: vehicle
      })

      // 添加点击事件
      marker.on('click', () => {
        showVehicleInfo(vehicle, marker)
        onVehicleClick?.(vehicle.id)
      })

      // 如果车辆在移动，添加方向指示
      if (vehicle.status === 'moving' && vehicle.location.direction !== undefined) {
        marker.setAngle(vehicle.location.direction)
      }

      marker.setMap(mapInstanceRef.current)
      markersRef.current.set(vehicle.id, marker)
      markers.push(marker)
    })

    // 创建点聚合
    if (markers.length > 0) {
      markerClustererRef.current = new window.AMap.MarkerCluster(
        mapInstanceRef.current,
        markers,
        {
          gridSize: 60,
          styles: [{
            url: getClusterIcon(),
            size: new window.AMap.Size(32, 32),
            textColor: '#fff',
            textSize: 12
          }]
        }
      )
    }
  }, [vehicles])

  // 获取车辆图标
  const getVehicleIcon = (vehicle: Vehicle) => {
    // 这里应该返回实际的图标URL
    // 根据车辆类型和状态返回不同的图标
    const baseUrl = '/vehicle-icons/'
    const status = vehicle.status === 'online' || vehicle.status === 'moving' ? 'active' : 'inactive'
    return `${baseUrl}${vehicle.type}-${status}.png`
  }

  // 获取聚合图标
  const getClusterIcon = () => {
    // 返回聚合图标URL
    return '/vehicle-icons/cluster.png'
  }

  // 显示车辆信息窗口
  const showVehicleInfo = (vehicle: Vehicle, marker: any) => {
    const content = `
      <div style="padding: 10px;">
        <h4 style="margin: 0 0 10px 0;">${vehicle.name}</h4>
        <p style="margin: 5px 0;">车牌号: ${vehicle.plateNumber}</p>
        <p style="margin: 5px 0;">状态: ${getStatusText(vehicle.status)}</p>
        ${vehicle.location.speed !== undefined ? 
          `<p style="margin: 5px 0;">速度: ${vehicle.location.speed} km/h</p>` : ''}
        ${vehicle.driver ? 
          `<p style="margin: 5px 0;">司机: ${vehicle.driver.name}</p>
           <p style="margin: 5px 0;">电话: ${vehicle.driver.phone}</p>` : ''}
        <p style="margin: 5px 0;">更新时间: ${new Date(vehicle.location.updateTime).toLocaleString()}</p>
      </div>
    `

    const infoWindow = new window.AMap.InfoWindow({
      content: content,
      offset: new window.AMap.Pixel(0, -30)
    })

    infoWindow.open(mapInstanceRef.current, marker.getPosition())
  }

  const getStatusText = (status: Vehicle['status']) => {
    const statusMap = {
      'online': '在线',
      'offline': '离线',
      'moving': '行驶中',
      'stopped': '停止'
    }
    return statusMap[status] || status
  }

  return (
    <div className={styles.mapContainer}>
      {loading && (
        <div className={styles.loading}>
          <Spin size="large" tip="地图加载中..." />
        </div>
      )}
      <div ref={mapRef} className={styles.map} />
      
      {/* 地图图例 */}
      <div className={styles.legend}>
        <h4>图例</h4>
        <div className={styles.legendItem}>
          <span className={styles.icon} style={{ backgroundColor: '#52c41a' }} />
          <span>在线/行驶中</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.icon} style={{ backgroundColor: '#999' }} />
          <span>离线/停止</span>
        </div>
      </div>

      {/* 地图工具栏 */}
      <div className={styles.toolbar}>
        <button onClick={() => {
          if (mapInstanceRef.current && vehicles.length > 0) {
            const bounds = new window.AMap.Bounds()
            vehicles.forEach(v => {
              bounds.extend([v.location.longitude, v.location.latitude])
            })
            mapInstanceRef.current.setBounds(bounds)
          }
        }}>
          显示全部车辆
        </button>
      </div>
    </div>
  )
}

export default VehicleMap