import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Space,
  Button,
  Tag,
  Tabs,
  Row,
  Col,
  Statistic,
  Timeline,
  Table,
  Empty,
  Spin,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  ControlOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { deviceService, Device } from '@/services/device'
import DeviceControlModal from '../DeviceList/components/DeviceControlModal'
import styles from './index.module.scss'

const { TabPane } = Tabs

const typeDisplayNames: Record<string, string> = {
  pump: '离心泵', valve: '电动阀门', sensor: '温度传感器', motor: '三相电机', tank: '储罐',
}

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [device, setDevice] = useState<Device | null>(null)
  const [activeTab, setActiveTab] = useState('realtime')
  const [controlModalVisible, setControlModalVisible] = useState(false)
  const [realtimeStats, setRealtimeStats] = useState<Record<string, number>>({})
  const [historyData, setHistoryData] = useState<{ temperature: any[]; pressure: any[]; flow: any[] }>({ temperature: [], pressure: [], flow: [] })

  useEffect(() => {
    if (id) {
      loadDeviceDetail(id)
    }
  }, [id])

  const loadDeviceDetail = async (deviceId: string) => {
    try {
      setLoading(true)
      const res = await deviceService.getDevice(deviceId)
      const body = res.data
      if (body.code === 0) {
        const raw = body.data
        setDevice({
          id: raw.deviceId,
          deviceId: raw.deviceId,
          name: raw.name,
          type: { id: raw.type, name: raw.type, displayName: typeDisplayNames[raw.type] || raw.type, category: raw.type },
          model: raw.model || '',
          status: raw.status,
          location: { building: raw.location || '' },
          lastOnlineAt: raw.lastSeen ? new Date(raw.lastSeen).toISOString() : undefined,
          properties: { manufacturer: raw.manufacturer, model: raw.model },
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        if (raw.latestData) {
          setRealtimeStats(raw.latestData)
        }
        loadHistory(raw.deviceId)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/v1/data/history/${deviceId}?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await res.json()
      if (body.code === 0 && body.data?.history) {
        const hist = body.data.history as Array<{ timestamp: number; data: Record<string, number> }>
        setHistoryData({
          temperature: hist.map(h => [new Date(h.timestamp), h.data.temperature ?? null]).filter(h => h[1] !== null),
          pressure: hist.map(h => [new Date(h.timestamp), h.data.pressure ?? null]).filter(h => h[1] !== null),
          flow: hist.map(h => [new Date(h.timestamp), h.data.flow ?? null]).filter(h => h[1] !== null),
        })
      }
    } catch {
      // silent
    }
  }

  const renderStatus = (status: string) => {
    const statusConfig = {
      online: { color: 'success', icon: <CheckCircleOutlined />, text: '在线' },
      offline: { color: 'default', icon: <CloseCircleOutlined />, text: '离线' },
      maintenance: { color: 'warning', icon: <SyncOutlined spin />, text: '维护中' },
      fault: { color: 'error', icon: <WarningOutlined />, text: '故障' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // 实时数据图表配置
  const realtimeChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['温度', '压力', '流量'] },
    xAxis: { type: 'time', splitLine: { show: false } },
    yAxis: [
      { type: 'value', name: '温度 (°C)', position: 'left' },
      { type: 'value', name: '压力 (bar)', position: 'right' },
    ],
    series: [
      { name: '温度', type: 'line', smooth: true, data: historyData.temperature, itemStyle: { color: '#ff4d4f' } },
      { name: '压力', type: 'line', smooth: true, yAxisIndex: 1, data: historyData.pressure, itemStyle: { color: '#1890ff' } },
      { name: '流量', type: 'line', smooth: true, data: historyData.flow, itemStyle: { color: '#52c41a' } },
    ],
  }

  // 操作日志数据
  const operationLogs = [
    {
      key: '1',
      time: '2024-01-20 10:30:00',
      operator: '张三',
      action: '启动设备',
      result: '成功',
    },
    {
      key: '2',
      time: '2024-01-20 09:15:00',
      operator: '李四',
      action: '修改参数',
      result: '成功',
      detail: '转速: 1200 → 1500 RPM',
    },
    {
      key: '3',
      time: '2024-01-19 14:30:00',
      operator: '王五',
      action: '停止设备',
      result: '成功',
    },
  ]

  const operationColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (text: string) => (
        <Tag color={text === '成功' ? 'success' : 'error'}>{text}</Tag>
      ),
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!device) {
    return <Empty description="设备不存在" />
  }

  return (
    <div className={styles.deviceDetail}>
      {/* Header */}
      <Card className={styles.header}>
        <div className={styles.headerContent}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/devices')}
            >
              返回
            </Button>
            <h2>{device.name}</h2>
            {renderStatus(device.status)}
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => loadDeviceDetail(id!)}>
              刷新
            </Button>
            <Button icon={<EditOutlined />}>编辑</Button>
            <Button 
              type="primary" 
              icon={<ControlOutlined />}
              onClick={() => setControlModalVisible(true)}
              disabled={device.status !== 'online'}
            >
              设备控制
            </Button>
            <Button icon={<SettingOutlined />}>配置</Button>
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前温度"
              value={realtimeStats.temperature ?? '--'}
              suffix="°C"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前压力"
              value={realtimeStats.pressure ?? '--'}
              suffix="bar"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={device.type.name === 'tank' ? '当前液位' : '当前流量'}
              value={realtimeStats.flow ?? realtimeStats.level ?? '--'}
              suffix={device.type.name === 'tank' ? '%' : 'm³/h'}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                ['pump', 'motor'].includes(device.type.name) ? '当前转速'
                : device.type.name === 'sensor' ? '当前湿度'
                : '当前振动'
              }
              value={
                ['pump', 'motor'].includes(device.type.name) ? (realtimeStats.rpm ?? '--')
                : device.type.name === 'sensor' ? (realtimeStats.humidity ?? '--')
                : (realtimeStats.vibration ?? '--')
              }
              suffix={
                ['pump', 'motor'].includes(device.type.name) ? 'rpm'
                : device.type.name === 'sensor' ? '%RH'
                : 'mm/s'
              }
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card style={{ marginTop: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="实时数据" key="realtime">
            <ReactECharts option={realtimeChartOption} style={{ height: 400 }} />
          </TabPane>
          
          <TabPane tab="基本信息" key="info">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="设备ID">{device.deviceId}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{device.name}</Descriptions.Item>
              <Descriptions.Item label="设备类型">{device.type.displayName}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{device.model || '-'}</Descriptions.Item>
              <Descriptions.Item label="制造商">{device.properties.manufacturer || '-'}</Descriptions.Item>
              <Descriptions.Item label="运行状态">{renderStatus(device.status)}</Descriptions.Item>
              <Descriptions.Item label="安装位置" span={2}>
                {device.location?.building || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后上线">
                {device.lastOnlineAt ? new Date(device.lastOnlineAt).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(device.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
          
          <TabPane tab="操作日志" key="logs">
            <Table
              columns={operationColumns}
              dataSource={operationLogs}
              pagination={false}
            />
          </TabPane>
          
          <TabPane tab="告警记录" key="alarms">
            <Timeline>
              <Timeline.Item color="red">
                2024-01-19 16:30:00 - 温度过高告警 (85°C)
              </Timeline.Item>
              <Timeline.Item color="yellow">
                2024-01-18 10:15:00 - 压力异常告警 (4.5 bar)
              </Timeline.Item>
              <Timeline.Item color="green">
                2024-01-17 14:20:00 - 设备恢复正常
              </Timeline.Item>
              <Timeline.Item>
                2024-01-17 13:45:00 - 设备离线
              </Timeline.Item>
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      {/* Control Modal */}
      <DeviceControlModal
        visible={controlModalVisible}
        device={device}
        onCancel={() => setControlModalVisible(false)}
      />
    </div>
  )
}

export default DeviceDetail