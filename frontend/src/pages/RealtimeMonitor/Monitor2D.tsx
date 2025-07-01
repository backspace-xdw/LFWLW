import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import { message, Empty, Spin } from 'antd'
import Pump from '../../components/GraphicsEditor/symbols/Pump'
import Valve from '../../components/GraphicsEditor/symbols/Valve'
import Tank from '../../components/GraphicsEditor/symbols/Tank'
import Sensor from '../../components/GraphicsEditor/symbols/Sensor'
import Motor from '../../components/GraphicsEditor/symbols/Motor'
import Pipe from '../../components/GraphicsEditor/symbols/Pipe'
import styles from './monitor2d.module.scss'

interface Monitor2DProps {
  sceneId: string
  deviceData: any
  alarms: any[]
}

const Monitor2D: React.FC<Monitor2DProps> = ({ sceneId, deviceData, alarms }) => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [loading, setLoading] = useState(true)
  const [sceneData, setSceneData] = useState<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)

  // 获取容器尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setDimensions({ width: clientWidth, height: clientHeight })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // 加载场景数据
  useEffect(() => {
    loadScene(sceneId)
  }, [sceneId])

  const loadScene = async (id: string) => {
    setLoading(true)
    try {
      // 从localStorage加载场景（实际应该从后端API加载）
      const savedScenes = localStorage.getItem('graphicsScenes')
      if (savedScenes) {
        const scenes = JSON.parse(savedScenes)
        const scene = scenes[id]
        if (scene) {
          setSceneData(scene)
        } else {
          // 如果没有保存的场景，创建一个示例场景
          const exampleScene = createExampleScene(id)
          setSceneData(exampleScene)
        }
      } else {
        // 创建示例场景
        const exampleScene = createExampleScene(id)
        setSceneData(exampleScene)
      }
    } catch (error) {
      console.error('Failed to load scene:', error)
      message.error('加载场景失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建示例场景
  const createExampleScene = (id: string) => {
    if (id === 'scene_001') {
      // 主生产线流程图
      return {
        id: 'scene_001',
        name: '主生产线流程图',
        shapes: [
          {
            id: 'pump1',
            type: 'pump',
            x: 100,
            y: 300,
            width: 80,
            height: 80,
            rotation: 0,
            deviceId: 'PUMP_001',
            showLabel: true,
          },
          {
            id: 'valve1',
            type: 'valve',
            x: 250,
            y: 320,
            width: 60,
            height: 40,
            rotation: 0,
            deviceId: 'VALVE_002',
            showLabel: true,
          },
          {
            id: 'tank1',
            type: 'tank',
            x: 400,
            y: 200,
            width: 120,
            height: 180,
            rotation: 0,
            deviceId: 'TANK_005',
            showLabel: true,
          },
          {
            id: 'motor1',
            type: 'motor',
            x: 600,
            y: 300,
            width: 80,
            height: 80,
            rotation: 0,
            deviceId: 'MOTOR_004',
            showLabel: true,
          },
          {
            id: 'sensor1',
            type: 'sensor',
            x: 450,
            y: 150,
            width: 40,
            height: 40,
            rotation: 0,
            deviceId: 'SENSOR_003',
            showLabel: true,
          },
          // 管道连接
          {
            id: 'pipe1',
            type: 'pipe',
            points: [180, 340, 250, 340],
            strokeWidth: 6,
          },
          {
            id: 'pipe2',
            type: 'pipe',
            points: [310, 340, 400, 340, 400, 300],
            strokeWidth: 6,
          },
          {
            id: 'pipe3',
            type: 'pipe',
            points: [520, 300, 600, 340],
            strokeWidth: 6,
          },
        ],
      }
    } else if (id === 'scene_002') {
      // 储罐区监控
      return {
        id: 'scene_002',
        name: '储罐区监控',
        shapes: [
          {
            id: 'tank1',
            type: 'tank',
            x: 150,
            y: 200,
            width: 120,
            height: 200,
            rotation: 0,
            deviceId: 'TANK_005',
            showLabel: true,
          },
          {
            id: 'tank2',
            type: 'tank',
            x: 350,
            y: 200,
            width: 120,
            height: 200,
            rotation: 0,
            deviceId: 'TANK_005',
            showLabel: true,
          },
          {
            id: 'tank3',
            type: 'tank',
            x: 550,
            y: 200,
            width: 120,
            height: 200,
            rotation: 0,
            deviceId: 'TANK_005',
            showLabel: true,
          },
          {
            id: 'sensor1',
            type: 'sensor',
            x: 190,
            y: 150,
            width: 40,
            height: 40,
            rotation: 0,
            deviceId: 'SENSOR_003',
            showLabel: true,
          },
          {
            id: 'sensor2',
            type: 'sensor',
            x: 390,
            y: 150,
            width: 40,
            height: 40,
            rotation: 0,
            deviceId: 'SENSOR_003',
            showLabel: true,
          },
          {
            id: 'sensor3',
            type: 'sensor',
            x: 590,
            y: 150,
            width: 40,
            height: 40,
            rotation: 0,
            deviceId: 'SENSOR_003',
            showLabel: true,
          },
        ],
      }
    }
    return { shapes: [] }
  }

  // 渲染图形
  const renderShape = (shape: any) => {
    const device = shape.deviceId && deviceData ? deviceData[shape.deviceId] : null
    const deviceAlarms = shape.deviceId && alarms ? alarms.filter(a => a.deviceId === shape.deviceId) : []
    const hasAlarm = deviceAlarms.some(a => a.status === 'active')

    const commonProps = {
      key: shape.id,
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation || 0,
      deviceId: shape.deviceId,
      deviceData: device,
      showLabel: shape.showLabel,
      hasAlarm,
      isMonitorMode: true, // 监控模式，禁用拖拽
    }

    switch (shape.type) {
      case 'pump':
        return <Pump {...commonProps} />
      case 'valve':
        return <Valve {...commonProps} />
      case 'tank':
        return <Tank {...commonProps} />
      case 'sensor':
        return <Sensor {...commonProps} />
      case 'motor':
        return <Motor {...commonProps} />
      case 'pipe':
        return (
          <Pipe
            key={shape.id}
            id={shape.id}
            points={shape.points}
            stroke={shape.stroke || '#666'}
            strokeWidth={shape.strokeWidth || 4}
            isMonitorMode={true}
          />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" tip="加载场景中..." />
      </div>
    )
  }

  if (!sceneData || !sceneData.shapes || sceneData.shapes.length === 0) {
    return (
      <div className={styles.empty}>
        <Empty description="暂无场景数据" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className={styles.monitor2d}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.stage}
      >
        <Layer>
          {sceneData.shapes.map((shape: any) => renderShape(shape))}
        </Layer>
      </Stage>

      {/* 场景信息 */}
      <div className={styles.sceneInfo}>
        <span>{sceneData.name}</span>
      </div>

      {/* 告警指示器 */}
      {alarms && alarms.filter(a => a.status === 'active').length > 0 && (
        <div className={styles.alarmIndicator}>
          <span className={styles.alarmDot} />
          {alarms.filter(a => a.status === 'active').length} 个活动告警
        </div>
      )}
    </div>
  )
}

export default Monitor2D