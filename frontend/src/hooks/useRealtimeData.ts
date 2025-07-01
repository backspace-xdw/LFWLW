import { useState, useEffect, useCallback, useRef } from 'react'
import { socketService, DeviceData } from '@/services/socket'

interface UseRealtimeDataOptions {
  deviceIds?: string[]
  onData?: (data: DeviceData) => void
  bufferSize?: number
}

export function useRealtimeData(options: UseRealtimeDataOptions = {}) {
  const { deviceIds = [], onData, bufferSize = 100 } = options
  const [connected, setConnected] = useState(false)
  const [dataBuffer, setDataBuffer] = useState<Map<string, DeviceData[]>>(new Map())
  const [latestData, setLatestData] = useState<Map<string, DeviceData>>(new Map())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 处理连接状态
  const handleConnected = useCallback((isConnected: boolean) => {
    if (mountedRef.current) {
      setConnected(isConnected)
    }
  }, [])

  // 处理设备数据
  const handleDeviceData = useCallback((data: DeviceData) => {
    if (!mountedRef.current) return

    // 更新最新数据
    setLatestData(prev => {
      const newMap = new Map(prev)
      newMap.set(data.deviceId, data)
      return newMap
    })

    // 更新数据缓冲区
    setDataBuffer(prev => {
      const newMap = new Map(prev)
      const deviceBuffer = newMap.get(data.deviceId) || []
      
      // 添加新数据并限制缓冲区大小
      const updatedBuffer = [...deviceBuffer, data].slice(-bufferSize)
      newMap.set(data.deviceId, updatedBuffer)
      
      return newMap
    })

    // 调用回调函数
    if (onData) {
      onData(data)
    }
  }, [bufferSize, onData])

  // 初始化连接和订阅
  useEffect(() => {
    // 连接Socket
    const socket = socketService.connect()
    
    // 监听连接状态
    socketService.on('connected', handleConnected)
    
    // 监听设备数据
    socketService.on('device:data', handleDeviceData)
    
    // 订阅设备
    if (deviceIds.length > 0) {
      socketService.subscribeDevice(deviceIds)
    }

    return () => {
      // 取消订阅
      if (deviceIds.length > 0) {
        socketService.unsubscribeDevice(deviceIds)
      }
      
      // 移除监听器
      socketService.off('connected', handleConnected)
      socketService.off('device:data', handleDeviceData)
    }
  }, [deviceIds, handleConnected, handleDeviceData])

  // 获取设备最新数据
  const getDeviceData = useCallback((deviceId: string) => {
    return latestData.get(deviceId)
  }, [latestData])

  // 获取设备历史数据
  const getDeviceHistory = useCallback((deviceId: string) => {
    return dataBuffer.get(deviceId) || []
  }, [dataBuffer])

  // 清空数据缓冲区
  const clearBuffer = useCallback(() => {
    setDataBuffer(new Map())
  }, [])

  return {
    connected,
    latestData,
    dataBuffer,
    getDeviceData,
    getDeviceHistory,
    clearBuffer,
  }
}

// 用于监控大屏的Hook
export function useMonitorData() {
  const [connected, setConnected] = useState(false)
  const [deviceData, setDeviceData] = useState<Record<string, DeviceData>>({})
  const [realtimeData, setRealtimeData] = useState<DeviceData[]>([])
  const [alarms, setAlarms] = useState<any[]>([])

  useEffect(() => {
    const socket = socketService.connect()
    
    // 订阅监控数据
    socketService.subscribeMonitor()
    socketService.subscribeAlarms()

    // 处理实时数据
    const handleRealtimeData = (data: DeviceData) => {
      setDeviceData(prev => ({
        ...prev,
        [data.deviceId]: data
      }))
      
      // 同时维护一个数组格式的实时数据，用于图表展示
      setRealtimeData(prev => [...prev, data].slice(-100)) // 保留最近100条数据
    }

    // 处理告警
    const handleAlarm = (alarm: any) => {
      setAlarms(prev => [alarm, ...prev.slice(0, 49)])
    }

    // 处理连接状态
    const handleConnected = (isConnected: boolean) => {
      setConnected(isConnected)
    }

    socketService.on('connected', handleConnected)
    socketService.on('realtime:data', handleRealtimeData)
    socketService.on('alarm:new', handleAlarm)

    return () => {
      socketService.off('connected', handleConnected)
      socketService.off('realtime:data', handleRealtimeData)
      socketService.off('alarm:new', handleAlarm)
    }
  }, [])

  return {
    connected,
    deviceData,
    realtimeData,
    alarms,
  }
}