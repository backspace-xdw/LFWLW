import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Progress, Space, Table, Tag, Tooltip, Badge } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WifiOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { deviceService } from '@/services/device'
import { useMonitorData } from '@/hooks/useRealtimeData'
import GaugeChart from '@/components/Charts/GaugeChart'
import styles from './index.module.scss'

interface DeviceStats {
  total: number
  online: number
  offline: number
  fault: number
}

interface AlarmStats {
  critical: number
  high: number
  medium: number
  low: number
}

const Dashboard: React.FC = () => {
  const { connected, realtimeData, alarms } = useMonitorData()

  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ total: 0, online: 0, offline: 0, fault: 0 })
  const [alarmStats, setAlarmStats] = useState<AlarmStats>({ critical: 0, high: 0, medium: 0, low: 0 })
  const [loading, setLoading] = useState(true)
  const [healthScore, setHealthScore] = useState(100)
  const [selectedDeviceId, setSelectedDeviceId] = useState('PUMP_001')
  const [gaugeData, setGaugeData] = useState({ temperature: 75.5, pressure: 3.2, flow: 125.8 })

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 更新仪表盘仪表数据
  useEffect(() => {
    if (realtimeData.length > 0) {
      const latestData = realtimeData[realtimeData.length - 1]
      if (latestData.deviceId === selectedDeviceId && latestData.data) {
        setGaugeData(prev => ({
          temperature: latestData.data.temperature ?? prev.temperature,
          pressure: latestData.data.pressure ?? prev.pressure,
          flow: latestData.data.flow ?? prev.flow,
        }))
      }
    }
  }, [realtimeData, selectedDeviceId])

  // 更新告警统计
  useEffect(() => {
    const stats = alarms.reduce((acc, alarm) => {
      if (alarm.severity in acc) {
        acc[alarm.severity]++
      }
      return acc
    }, { critical: 0, high: 0, medium: 0, low: 0 })
    
    setAlarmStats(stats)
  }, [alarms])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const res = await deviceService.getDeviceList({ pageSize: 1000 } as any)
      const list: any[] = res?.data?.data?.items || []
      const online = list.filter((d: any) => d.status === 'online').length
      const offline = list.filter((d: any) => d.status === 'offline').length
      const fault = list.filter((d: any) => d.status === 'fault').length
      setDeviceStats({ total: list.length, online, offline, fault })
      setHealthScore(list.length > 0 ? Math.round((online / list.length) * 100) : 100)
      if (list.length > 0) setSelectedDeviceId(list[0].deviceId)
    } catch {
      // 静默降级
    } finally {
      setLoading(false)
    }
  }

  // 设备状态饼图配置
  const deviceStatusOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: deviceStats.online, name: '在线', itemStyle: { color: '#52c41a' } },
          { value: deviceStats.offline, name: '离线', itemStyle: { color: '#d9d9d9' } },
          { value: deviceStats.fault, name: '故障', itemStyle: { color: '#ff4d4f' } },
        ],
      },
    ],
  }

  // 实时数据趋势图配置
  const realtimeTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['温度', '压力', '流量'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: [
      {
        type: 'value',
        name: '温度/流量',
        position: 'left',
      },
      {
        type: 'value',
        name: '压力',
        position: 'right',
      },
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        smooth: true,
        data: realtimeData
          .filter(d => d.deviceId === selectedDeviceId && d.data.temperature !== undefined)
          .map(d => [d.timestamp, d.data.temperature]),
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: '压力',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: realtimeData
          .filter(d => d.deviceId === selectedDeviceId && d.data.pressure !== undefined)
          .map(d => [d.timestamp, d.data.pressure]),
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '流量',
        type: 'line',
        smooth: true,
        data: realtimeData
          .filter(d => d.deviceId === selectedDeviceId && d.data.flow !== undefined)
          .map(d => [d.timestamp, d.data.flow]),
        itemStyle: { color: '#52c41a' },
      },
    ],
  }

  // 最新告警表格
  const alarmColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string | number) => new Date(t).toLocaleTimeString(),
    },
    {
      title: '设备',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 120,
    },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: string) => {
        const colors = {
          critical: 'error',
          high: 'warning',
          medium: 'gold',
          low: 'default',
        }
        return <Tag color={colors[severity] || 'default'}>{severity.toUpperCase()}</Tag>
      },
    },
    {
      title: '告警信息',
      dataIndex: 'message',
      key: 'message',
    },
  ]

  return (
    <div className={styles.dashboard}>
      {/* 连接状态指示器 */}
      <div className={styles.connectionStatus}>
        <Badge
          status={connected ? 'success' : 'error'}
          text={
            <Space>
              <WifiOutlined />
              {connected ? '实时数据已连接' : '实时数据断开'}
            </Space>
          }
        />
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="设备总数"
              value={deviceStats.total}
              prefix={<AppstoreOutlined />}
              suffix="台"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="在线设备"
              value={deviceStats.online}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${deviceStats.total}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={Math.round((deviceStats.online / deviceStats.total) * 100)}
              strokeColor="#52c41a"
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="活动告警"
              value={alarmStats.critical + alarmStats.high + alarmStats.medium + alarmStats.low}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div className={styles.alarmBadges}>
              <Tag color="error">严重 {alarmStats.critical}</Tag>
              <Tag color="warning">高 {alarmStats.high}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="数据吞吐量"
              value={realtimeData.length}
              prefix={<SyncOutlined spin />}
              suffix="条/分钟"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="设备状态分布" className={styles.chartCard}>
            <ReactECharts option={deviceStatusOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="实时数据趋势（主泵）" className={styles.chartCard}>
            <ReactECharts option={realtimeTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 仪表盘展示 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={18}>
          <Card title="关键设备监控" className={styles.chartCard}>
            <Row gutter={16}>
              <Col span={8}>
                <GaugeChart
                  title="主泵压力"
                  value={gaugeData.pressure}
                  max={5}
                  unit="bar"
                  thresholds={[2, 3.5, 4.5]}
                />
              </Col>
              <Col span={8}>
                <GaugeChart
                  title="系统温度"
                  value={gaugeData.temperature}
                  max={100}
                  unit="°C"
                  thresholds={[60, 80, 90]}
                />
              </Col>
              <Col span={8}>
                <GaugeChart
                  title="流量"
                  value={gaugeData.flow}
                  max={200}
                  unit="m³/h"
                  thresholds={[80, 140, 180]}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="系统健康度" className={styles.chartCard}>
            <div className={styles.healthScore}>
              <Progress
                type="circle"
                percent={healthScore}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 'bold' }}>{percent}%</div>
                    <div style={{ fontSize: 14, color: '#666' }}>健康</div>
                  </div>
                )}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最新告警 */}
      <Card title="最新告警" style={{ marginTop: 16 }}>
        <Table
          columns={alarmColumns}
          dataSource={alarms.slice(0, 5)}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  )
}

export default Dashboard