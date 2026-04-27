import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Statistic, Radio, Spin, Empty, Space, message } from 'antd'
import {
  AlertOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import request from '@/utils/request'

interface Props {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
  refreshKey: number
}

interface AlarmData {
  timeline: { timestamp: string; total: number; critical: number; high: number; medium: number; low: number }[]
  bySeverity: { severity: string; count: number }[]
  byMonitorType: { monitorType: string; count: number }[]
  byInstrument: { instrumentId: string; location: string; monitorType: string; count: number }[]
  byAlarmType: { alarmType: string; label: string; count: number }[]
  avgResponseMinutes: number
  resolutionRate: number
  stats: { total: number; active: number; acknowledged: number; resolved: number }
}

const severityColors: Record<string, string> = {
  '紧急': '#ff4d4f',
  '高': '#fa8c16',
  '中': '#fadb14',
  '低': '#1890ff',
}

const AlarmAnalysis: React.FC<Props> = ({ dateRange, refreshKey }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AlarmData | null>(null)
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week'>('day')

  useEffect(() => {
    fetchData()
  }, [refreshKey, groupBy])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/api/v1/analysis/alarm-analysis', {
        params: {
          startTime: dateRange[0].toISOString(),
          endTime: dateRange[1].toISOString(),
          groupBy,
        },
      })
      setData((res as any)?.data?.data || null)
    } catch {
      message.error('加载告警分析数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 堆叠柱状图
  const stackOption = useMemo(() => {
    if (!data) return {}
    const fmt = groupBy === 'hour' ? 'MM-DD HH:mm' : 'MM-DD'
    const xData = data.timeline.map(t => dayjs(t.timestamp).format(fmt))
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['紧急', '高', '中', '低'], bottom: 0 },
      grid: { left: 50, right: 20, top: 10, bottom: 50 },
      xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '告警数量' },
      series: [
        { name: '紧急', type: 'bar', stack: 'total', data: data.timeline.map(t => t.critical), itemStyle: { color: '#ff4d4f' } },
        { name: '高', type: 'bar', stack: 'total', data: data.timeline.map(t => t.high), itemStyle: { color: '#fa8c16' } },
        { name: '中', type: 'bar', stack: 'total', data: data.timeline.map(t => t.medium), itemStyle: { color: '#fadb14' } },
        { name: '低', type: 'bar', stack: 'total', data: data.timeline.map(t => t.low), itemStyle: { color: '#1890ff' } },
      ],
    }
  }, [data, groupBy])

  // 严重等级饼图
  const severityPieOption = useMemo(() => {
    if (!data) return {}
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: data.bySeverity.filter(s => s.count > 0).map(s => ({
          name: s.severity,
          value: s.count,
          itemStyle: { color: severityColors[s.severity] || '#999' },
        })),
        label: { show: true, formatter: '{b}\n{c}' },
      }],
    }
  }, [data])

  // 告警类型饼图
  const alarmTypePieOption = useMemo(() => {
    if (!data) return {}
    const colors = ['#ff4d4f', '#fa8c16', '#fadb14', '#52c41a']
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: data.byAlarmType.filter(a => a.count > 0).map((a, i) => ({
          name: a.label,
          value: a.count,
          itemStyle: { color: colors[i % colors.length] },
        })),
        label: { show: true, formatter: '{b}\n{c}' },
      }],
    }
  }, [data])

  // 监测类型告警分布
  const typeBarOption = useMemo(() => {
    if (!data) return {}
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 80, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: data.byMonitorType.map(m => m.monitorType), axisLabel: { rotate: 20 } },
      yAxis: { type: 'value', name: '告警数量' },
      series: [{
        type: 'bar',
        data: data.byMonitorType.map(m => m.count),
        itemStyle: { color: '#1890ff' },
        label: { show: true, position: 'top' },
      }],
    }
  }, [data])

  // TOP 10 仪表
  const topBarOption = useMemo(() => {
    if (!data) return {}
    const top = data.byInstrument.slice(0, 10).reverse()
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 160, right: 40, top: 10, bottom: 10 },
      xAxis: { type: 'value', name: '告警次数' },
      yAxis: {
        type: 'category',
        data: top.map(i => `${i.instrumentId} ${i.location}`),
        axisLabel: { width: 150, overflow: 'truncate' },
      },
      series: [{
        type: 'bar',
        data: top.map(i => i.count),
        itemStyle: { color: '#ff4d4f' },
        label: { show: true, position: 'right', formatter: '{c}' },
      }],
    }
  }, [data])

  if (loading && !data) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!data) {
    return <Empty description="暂无数据，请点击查询" />
  }

  return (
    <div>
      {/* 筛选 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>分组粒度:</span>
          <Radio.Group value={groupBy} onChange={e => setGroupBy(e.target.value)} optionType="button" size="small">
            <Radio.Button value="hour">按小时</Radio.Button>
            <Radio.Button value="day">按天</Radio.Button>
            <Radio.Button value="week">按周</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="告警总数" value={data.stats.total} prefix={<AlertOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="活跃告警" value={data.stats.active} prefix={<FireOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="解决率" value={data.resolutionRate} suffix="%" prefix={<CheckCircleOutlined />} valueStyle={{ color: data.resolutionRate >= 70 ? '#52c41a' : '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="平均响应" value={data.avgResponseMinutes} suffix="分钟" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      {/* 告警趋势 */}
      <Card title="告警趋势" size="small" style={{ marginBottom: 16 }}>
        <ReactECharts option={stackOption} style={{ height: 350 }} />
      </Card>

      {/* 严重等级 + 告警类型 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="严重等级分布" size="small">
            <ReactECharts option={severityPieOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="告警类型分布" size="small">
            <ReactECharts option={alarmTypePieOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 监测类型 + TOP仪表 */}
      <Row gutter={16}>
        <Col span={10}>
          <Card title="监测类型告警分布" size="small">
            <ReactECharts option={typeBarOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="TOP 10 告警仪表" size="small">
            <ReactECharts option={topBarOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AlarmAnalysis
