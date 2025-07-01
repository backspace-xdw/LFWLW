import React from 'react'
import { Card, Row, Col, Statistic, Progress, List, Tag, Empty } from 'antd'
import {
  ThunderboltOutlined,
  AlertOutlined,
  DashboardOutlined,
  FireOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import styles from './monitorStats.module.scss'

interface MonitorStatsProps {
  deviceData: any
  alarms: any[]
}

const MonitorStats: React.FC<MonitorStatsProps> = ({ deviceData, alarms }) => {
  // 计算设备状态统计
  const deviceStats = {
    total: Object.keys(deviceData).length,
    online: Object.values(deviceData).filter((d: any) => d.status === 'online').length,
    offline: Object.values(deviceData).filter((d: any) => d.status === 'offline').length,
  }

  // 计算告警统计
  const alarmStats = {
    total: alarms.length,
    active: alarms.filter(a => a.status === 'active').length,
    critical: alarms.filter(a => a.severity === 'critical').length,
    high: alarms.filter(a => a.severity === 'high').length,
    medium: alarms.filter(a => a.severity === 'medium').length,
    low: alarms.filter(a => a.severity === 'low').length,
  }

  // 获取最新的设备数据
  const latestData = Object.entries(deviceData).map(([id, device]: [string, any]) => ({
    id,
    name: device.name || id,
    temperature: device.data?.temperature,
    pressure: device.data?.pressure,
    status: device.status,
  })).filter(d => d.temperature || d.pressure)

  // 告警趋势图配置
  const alarmTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['严重', '高', '中', '低'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '严重',
        type: 'line',
        data: [2, 3, 1, 4, 2, 3],
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: '高',
        type: 'line',
        data: [5, 4, 6, 3, 5, 4],
        itemStyle: { color: '#fa8c16' },
      },
      {
        name: '中',
        type: 'line',
        data: [8, 10, 7, 9, 8, 10],
        itemStyle: { color: '#faad14' },
      },
      {
        name: '低',
        type: 'line',
        data: [12, 15, 10, 13, 11, 14],
        itemStyle: { color: '#1890ff' },
      },
    ],
  }

  return (
    <div className={styles.monitorStats}>
      {/* 设备状态概览 */}
      <Card title="设备状态" size="small" className={styles.statsCard}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="总数"
              value={deviceStats.total}
              prefix={<DashboardOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="在线"
              value={deviceStats.online}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="离线"
              value={deviceStats.offline}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
        <Progress
          percent={(deviceStats.online / deviceStats.total) * 100}
          strokeColor="#52c41a"
          format={percent => `${percent?.toFixed(0)}%`}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 告警统计 */}
      <Card title="告警统计" size="small" className={styles.statsCard}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Tag color="#ff4d4f">严重: {alarmStats.critical}</Tag>
          </Col>
          <Col span={12}>
            <Tag color="#fa8c16">高: {alarmStats.high}</Tag>
          </Col>
          <Col span={12}>
            <Tag color="#faad14">中: {alarmStats.medium}</Tag>
          </Col>
          <Col span={12}>
            <Tag color="#1890ff">低: {alarmStats.low}</Tag>
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <span>活动告警: </span>
          <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
            {alarmStats.active}
          </span>
        </div>
      </Card>

      {/* 告警趋势 */}
      <Card title="告警趋势" size="small" className={styles.statsCard}>
        <ReactECharts
          option={alarmTrendOption}
          style={{ height: 200 }}
          opts={{ renderer: 'svg' }}
        />
      </Card>

      {/* 实时数据 */}
      <Card title="实时数据" size="small" className={styles.statsCard}>
        {latestData.length > 0 ? (
          <List
            size="small"
            dataSource={latestData.slice(0, 5)}
            renderItem={item => (
              <List.Item>
                <div className={styles.dataItem}>
                  <span className={styles.deviceName}>{item.name}</span>
                  <div className={styles.dataValues}>
                    {item.temperature && (
                      <Tag color={item.temperature > 80 ? 'red' : 'green'}>
                        <FireOutlined /> {item.temperature.toFixed(1)}°C
                      </Tag>
                    )}
                    {item.pressure && (
                      <Tag color={item.pressure > 4 ? 'orange' : 'blue'}>
                        {item.pressure.toFixed(2)} bar
                      </Tag>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无数据" />
        )}
      </Card>
    </div>
  )
}

export default MonitorStats