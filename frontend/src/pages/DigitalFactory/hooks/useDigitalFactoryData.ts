/**
 * 数字工厂数据Hook
 * 管理数据获取、WebSocket实时订阅和状态管理
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DigitalFactoryData,
  AlarmRecord,
  ProductionOverviewItem,
  CameraInfo,
  QualificationRateData,
  ProductQualityData,
  InventoryData,
  ProductionLineException,
  EquipmentStatus,
  UseDigitalFactoryDataReturn,
} from '../types'
import { digitalFactoryService } from '@/services/digitalFactory'
import { socketService, AlarmData } from '@/services/socket'

// ===== 默认静态数据 =====
const defaultQualificationRate: QualificationRateData = {
  inspectionCount: 800,
  defectCount: 200,
}

const defaultProductQuality: ProductQualityData = {
  dates: ['10/01', '10/02', '10/03', '10/04', '10/05'],
  rates: [420, 380, 450, 400, 460],
}

const defaultInventory: InventoryData = {
  years: ['2020', '2021', '2022', '2023', '2024', '2025'],
  levels: [650, 780, 520, 880, 750, 400],
}

const defaultExceptions: ProductionLineException[] = [
  { year: '2025', outputValue: '30亿', perCapitaOutput: 1000, employeeCount: '1万' },
  { year: '2024', outputValue: '40亿', perCapitaOutput: 1200, employeeCount: '2万' },
  { year: '2023', outputValue: '35亿', perCapitaOutput: 1100, employeeCount: '1.5万' },
  { year: '2022', outputValue: '32亿', perCapitaOutput: 1050, employeeCount: '1.2万' },
  { year: '2021', outputValue: '28亿', perCapitaOutput: 950, employeeCount: '1.1万' },
  { year: '2020', outputValue: '25亿', perCapitaOutput: 900, employeeCount: '1万' },
  { year: '2019', outputValue: '22亿', perCapitaOutput: 850, employeeCount: '0.9万' },
  { year: '2018', outputValue: '20亿', perCapitaOutput: 800, employeeCount: '0.8万' },
]

const defaultAlarms: AlarmRecord[] = [
  { time: '22:41:05', device: '1#压缩机', level: 'high', content: '温度超限 85.2°C' },
  { time: '22:38:22', device: '3#传送带', level: 'medium', content: '运行速度异常' },
  { time: '22:35:18', device: '2#泵站', level: 'low', content: '流量波动 ±5%' },
  { time: '22:30:45', device: '5#阀门', level: 'high', content: '压力异常 12.5MPa' },
  { time: '22:28:10', device: '4#电机', level: 'medium', content: '电流过载 125A' },
  { time: '22:25:33', device: '1#储罐', level: 'low', content: '液位低于设定值' },
  { time: '22:20:15', device: '6#风机', level: 'high', content: '振动超标 8.5mm/s' },
  { time: '22:15:42', device: '2#换热器', level: 'medium', content: '效率下降 15%' },
]

const defaultEquipmentStatus: EquipmentStatus = {
  total: 23,
  running: 20,
  idle: 3,
}

const defaultProductionOverview: ProductionOverviewItem[] = [
  { name: '产品A', plan: 1007, actual: 907, completion: 20 },
  { name: '产品B', plan: 1007, actual: 907, completion: 40 },
]

const defaultCameras: CameraInfo[] = [
  {
    id: 'CAM-01',
    name: '生产车间监控',
    location: '1号生产线',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    poster: '/images/video-poster-1.jpg',
  },
  {
    id: 'CAM-02',
    name: '仓储区域监控',
    location: '仓储中心',
    src: 'https://www.w3schools.com/html/movie.mp4',
    poster: '/images/video-poster-2.jpg',
  },
  {
    id: 'CAM-03',
    name: '装配车间监控',
    location: '2号装配线',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    poster: '/images/video-poster-3.jpg',
  },
  {
    id: 'CAM-04',
    name: '质检中心监控',
    location: '质检区域',
    src: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    poster: '/images/video-poster-4.jpg',
  },
]

const defaultData: DigitalFactoryData = {
  qualificationRate: defaultQualificationRate,
  productQuality: defaultProductQuality,
  inventory: defaultInventory,
  exceptions: defaultExceptions,
  alarms: defaultAlarms,
  equipmentStatus: defaultEquipmentStatus,
  productionOverview: defaultProductionOverview,
  cameras: defaultCameras,
}

// ===== 数据Hook =====
export const useDigitalFactoryData = (): UseDigitalFactoryDataReturn => {
  const [data, setData] = useState<DigitalFactoryData>(defaultData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const socketConnectedRef = useRef(false)

  // 从API获取数据
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 并行获取所有数据
      const [
        qualificationRateRes,
        productQualificationRes,
        warehouseInventoryRes,
        productionLineExceptionRes,
        productionOverviewRes,
      ] = await Promise.allSettled([
        digitalFactoryService.getQualificationRate(),
        digitalFactoryService.getProductQualification(),
        digitalFactoryService.getWarehouseInventory(),
        digitalFactoryService.getProductionLineException(),
        digitalFactoryService.getProductionOverview('日'),
      ])

      // 处理响应，失败则使用默认值
      const newData: Partial<DigitalFactoryData> = {}

      if (qualificationRateRes.status === 'fulfilled' && qualificationRateRes.value) {
        newData.qualificationRate = qualificationRateRes.value
      }

      if (productQualificationRes.status === 'fulfilled' && Array.isArray(productQualificationRes.value)) {
        const apiData = productQualificationRes.value
        newData.productQuality = {
          dates: apiData.map((d: any) => d.date),
          rates: apiData.map((d: any) => d.productionValue),
        }
      }

      if (warehouseInventoryRes.status === 'fulfilled' && Array.isArray(warehouseInventoryRes.value)) {
        const apiData = warehouseInventoryRes.value
        newData.inventory = {
          years: apiData.map((d: any) => d.year),
          levels: apiData.map((d: any) => d.quantity),
        }
      }

      if (productionLineExceptionRes.status === 'fulfilled' && Array.isArray(productionLineExceptionRes.value)) {
        newData.exceptions = productionLineExceptionRes.value
      }

      if (productionOverviewRes.status === 'fulfilled' && Array.isArray(productionOverviewRes.value)) {
        newData.productionOverview = productionOverviewRes.value
      }

      setData((prev) => ({ ...prev, ...newData }))
    } catch (err) {
      console.warn('数据获取失败，使用默认数据:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 处理新告警
  const handleNewAlarm = useCallback((alarm: AlarmData) => {
    const newAlarm: AlarmRecord = {
      time: new Date(alarm.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
      device: alarm.deviceId,
      level: alarm.severity === 'critical' ? 'high' : alarm.severity,
      content: alarm.message,
    }

    setData((prev) => ({
      ...prev,
      alarms: [newAlarm, ...prev.alarms.slice(0, 7)], // 保留最新8条
    }))
  }, [])

  // 处理设备状态更新
  const handleDeviceStatus = useCallback((statusList: any[]) => {
    const total = statusList.length
    const running = statusList.filter((s) => s.status === 'online').length
    const idle = total - running

    setData((prev) => ({
      ...prev,
      equipmentStatus: { total, running, idle },
    }))
  }, [])

  // 订阅WebSocket事件
  useEffect(() => {
    const connectSocket = () => {
      try {
        socketService.connect()
        socketConnectedRef.current = true

        // 订阅告警
        socketService.subscribeAlarms()
        socketService.on('alarm:new', handleNewAlarm)

        // 订阅设备状态
        socketService.subscribeMonitor()
        socketService.on('device:status', handleDeviceStatus)
      } catch (err) {
        console.warn('WebSocket连接失败:', err)
      }
    }

    connectSocket()

    return () => {
      if (socketConnectedRef.current) {
        socketService.off('alarm:new', handleNewAlarm)
        socketService.off('device:status', handleDeviceStatus)
      }
    }
  }, [handleNewAlarm, handleDeviceStatus])

  // 初始数据获取
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 按时段刷新生产概览
  const refetchProductionOverview = useCallback(async (period: '日' | '周' | '月') => {
    try {
      const res = await digitalFactoryService.getProductionOverview(period)
      if (Array.isArray(res)) {
        setData((prev) => ({ ...prev, productionOverview: res }))
      }
    } catch {
      // 静默降级
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    refetchProductionOverview,
  }
}

export default useDigitalFactoryData
