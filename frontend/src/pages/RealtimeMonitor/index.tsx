import React, { useState, useEffect } from 'react'
import {
  Card,
  Space,
  Button,
  Radio,
  Row,
  Col,
  Statistic,
  Tag,
  Select,
  message,
  Spin,
  Empty,
} from 'antd'
import {
  DesktopOutlined,
  AppstoreAddOutlined,
  BarChartOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons'
import { useMonitorData } from '@/hooks/useRealtimeData'
import Monitor2D from './Monitor2D'
import Monitor3D from './Monitor3D'
import MonitorStats from './MonitorStats'
import styles from './index.module.scss'

type ViewMode = '2d' | '3d' | 'split'

interface Scene {
  id: string
  name: string
  type: '2d' | '3d'
  thumbnail?: string
  description?: string
}

const RealtimeMonitor: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [selectedScene, setSelectedScene] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scenes, setScenes] = useState<Scene[]>([])
  
  const { deviceData, alarms } = useMonitorData()

  // 加载可用场景
  useEffect(() => {
    loadScenes()
  }, [])

  const loadScenes = () => {
    // 模拟加载场景列表
    const mockScenes: Scene[] = [
      {
        id: 'scene_001',
        name: '主生产线流程图',
        type: '2d',
        description: '显示主要生产设备和管道连接',
      },
      {
        id: 'scene_002',
        name: '储罐区监控',
        type: '2d',
        description: '储罐液位和温度监控',
      },
      {
        id: 'scene_003',
        name: '3D设备展示',
        type: '3d',
        description: '设备3D模型和数据展示',
      },
    ]
    setScenes(mockScenes)
    
    // 默认选择第一个场景
    if (mockScenes.length > 0) {
      setSelectedScene(mockScenes[0].id)
    }
  }

  const handleSceneChange = (sceneId: string) => {
    setSelectedScene(sceneId)
    const scene = scenes.find(s => s.id === sceneId)
    if (scene) {
      // 根据场景类型自动切换视图模式
      setViewMode(scene.type === '3d' ? '3d' : '2d')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 统计数据
  const stats = {
    totalDevices: deviceData ? Object.keys(deviceData).length : 0,
    onlineDevices: deviceData ? Object.values(deviceData).filter((d: any) => d?.status === 'online').length : 0,
    activeAlarms: alarms ? alarms.filter(a => a.status === 'active').length : 0,
    dataPoints: deviceData ? Object.values(deviceData).reduce((sum: number, device: any) => {
      return sum + (device?.data ? Object.keys(device.data).length : 0)
    }, 0) : 0,
  }

  return (
    <div className={styles.realtimeMonitor}>
      {/* 顶部工具栏 */}
      <Card className={styles.toolbar}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              {/* 场景选择 */}
              <Space>
                <span>监控场景:</span>
                <Select
                  style={{ width: 200 }}
                  value={selectedScene}
                  onChange={handleSceneChange}
                  placeholder="选择监控场景"
                >
                  {scenes.map(scene => (
                    <Select.Option key={scene.id} value={scene.id}>
                      <Space>
                        {scene.type === '3d' ? <AppstoreAddOutlined /> : <DesktopOutlined />}
                        {scene.name}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Space>

              {/* 视图模式切换 */}
              <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)}>
                <Radio.Button value="2d">
                  <DesktopOutlined /> 2D视图
                </Radio.Button>
                <Radio.Button value="3d">
                  <AppstoreAddOutlined /> 3D视图
                </Radio.Button>
                <Radio.Button value="split">
                  <BarChartOutlined /> 分屏模式
                </Radio.Button>
              </Radio.Group>

              {/* 全屏按钮 */}
              <Button
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? '退出全屏' : '全屏'}
              </Button>
            </Space>
          </Col>

          <Col>
            {/* 实时统计 */}
            <Space size="large">
              <Statistic
                title="在线设备"
                value={stats.onlineDevices}
                suffix={`/ ${stats.totalDevices}`}
                prefix={<ThunderboltOutlined />}
              />
              <Statistic
                title="活动告警"
                value={stats.activeAlarms}
                valueStyle={stats.activeAlarms > 0 ? { color: '#ff4d4f' } : {}}
                prefix={<AlertOutlined />}
              />
              <Statistic
                title="数据点"
                value={stats.dataPoints}
                prefix={<DashboardOutlined />}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主监控区域 */}
      <div className={styles.monitorArea}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" tip="加载场景中..." />
          </div>
        ) : !selectedScene ? (
          <Empty description="请选择一个监控场景" />
        ) : (
          <>
            {viewMode === '2d' && (
              <Monitor2D 
                sceneId={selectedScene}
                deviceData={deviceData}
                alarms={alarms}
              />
            )}
            {viewMode === '3d' && (
              <Monitor3D
                sceneId={selectedScene}
                deviceData={deviceData}
                alarms={alarms}
              />
            )}
            {viewMode === 'split' && (
              <Row gutter={16} className={styles.splitView}>
                <Col span={16}>
                  <Card title="2D监控视图" className={styles.viewCard}>
                    <Monitor2D 
                      sceneId={selectedScene}
                      deviceData={deviceData}
                      alarms={alarms}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="数据统计" className={styles.viewCard}>
                    <MonitorStats
                      deviceData={deviceData}
                      alarms={alarms}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RealtimeMonitor