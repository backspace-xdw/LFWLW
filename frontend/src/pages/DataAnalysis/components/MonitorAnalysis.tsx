import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Statistic, Select, Radio, Table, Spin, Empty, Tag, Space, message } from 'antd'
import {
  MonitorOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import request from '@/utils/request'

interface Props {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
  refreshKey: number
}

interface HistoryPoint {
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  timestamp: string
  value: number
  alarmStatus: string
}

interface InstrumentSummaryItem {
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  avg: number
  max: number
  min: number
  stdDev: number
  dataPoints: number
  alarmCount: number
  alarmRate: number
}

const monitorTypeColors: Record<string, string> = {
  '液位': '#1890ff',
  '温度': '#ff4d4f',
  '压力': '#52c41a',
  '流量': '#722ed1',
  '可燃气体': '#fa8c16',
  '有毒气体(H2S)': '#eb2f96',
  '有毒气体(NH3)': '#13c2c2',
}

const MonitorAnalysis: React.FC<Props> = ({ dateRange, refreshKey }) => {
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([])
  const [summaryData, setSummaryData] = useState<InstrumentSummaryItem[]>([])
  const [monitorTypes, setMonitorTypes] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [interval, setInterval] = useState<'minute' | 'hour' | 'day'>('hour')
  const [stats, setStats] = useState({ total: 0, normal: 0, alarming: 0, faultOffline: 0 })

  useEffect(() => {
    fetchMonitorTypes()
  }, [])

  useEffect(() => {
    fetchData()
  }, [refreshKey, selectedTypes, interval])

  const fetchMonitorTypes = async () => {
    try {
      const res = await request.get('/api/v1/analysis/monitor-types')
      const types = (res as any)?.data?.data || []
      setMonitorTypes(types)
    } catch {}
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        startTime: dateRange[0].toISOString(),
        endTime: dateRange[1].toISOString(),
        interval,
      }
      if (selectedTypes.length > 0) {
        params.monitorTypes = selectedTypes.join(',')
      }

      const [histRes, summRes, statsRes] = await Promise.all([
        request.get('/api/v1/analysis/instrument-history', { params }),
        request.get('/api/v1/analysis/instrument-summary', { params }),
        request.get('/api/v1/instruments/stats'),
      ])

      setHistoryData((histRes as any)?.data?.data || [])
      setSummaryData((summRes as any)?.data?.data || [])
      const s = (statsRes as any)?.data?.data || (statsRes as any)?.data || {}
      setStats({
        total: s.total || 0,
        normal: s.normal || 0,
        alarming: s.alarming || 0,
        faultOffline: (s.fault || 0) + (s.offline || 0),
      })
    } catch {
      message.error('加载监测数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 按监测类型分组的趋势图
  const trendOptionsByType = useMemo(() => {
    // 按 monitorType 分组
    const typeGroups = new Map<string, HistoryPoint[]>()
    for (const p of historyData) {
      const arr = typeGroups.get(p.monitorType) || []
      arr.push(p)
      typeGroups.set(p.monitorType, arr)
    }

    const result: { type: string; unit: string; option: any }[] = []

    for (const [monitorType, points] of typeGroups) {
      // 按仪表分组
      const instGroups = new Map<string, { times: string[]; values: number[] }>()
      for (const p of points) {
        const key = `${p.instrumentId} ${p.location}`
        if (!instGroups.has(key)) instGroups.set(key, { times: [], values: [] })
        const g = instGroups.get(key)!
        g.times.push(dayjs(p.timestamp).format('MM-DD HH:mm'))
        g.values.push(p.value)
      }

      const series: any[] = []
      const legendData: string[] = []
      const colors = ['#1890ff', '#ff4d4f', '#52c41a', '#722ed1', '#fa8c16', '#13c2c2']
      let colorIdx = 0

      for (const [name, { values }] of instGroups) {
        legendData.push(name)
        series.push({
          name,
          type: 'line',
          smooth: true,
          data: values,
          symbol: 'none',
          lineStyle: { width: 2 },
          itemStyle: { color: colors[colorIdx++ % colors.length] },
        })
      }

      const firstGroup = instGroups.values().next().value
      const xData = firstGroup?.times || []
      const unit = points[0]?.unit || ''

      result.push({
        type: monitorType,
        unit,
        option: {
          tooltip: { trigger: 'axis' },
          legend: { data: legendData, top: 0 },
          grid: { left: 60, right: 20, top: 30, bottom: 50 },
          xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30 } },
          yAxis: { type: 'value', name: `${monitorType} (${unit})` },
          dataZoom: [{ type: 'slider', start: 0, end: 100 }],
          series,
        },
      })
    }

    return result
  }, [historyData])

  // 报警率柱状图
  const alarmBarOption = useMemo(() => {
    const sorted = [...summaryData].filter(s => s.alarmRate > 0).sort((a, b) => b.alarmRate - a.alarmRate)
    return {
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0]?.name}<br/>报警率: ${p[0]?.value}%` },
      grid: { left: 120, right: 20, top: 10, bottom: 10 },
      xAxis: { type: 'value', name: '报警率 (%)' },
      yAxis: {
        type: 'category',
        data: sorted.map(s => `${s.instrumentId} ${s.location}`),
        axisLabel: { width: 110, overflow: 'truncate' },
      },
      series: [{
        type: 'bar',
        data: sorted.map(s => ({
          value: s.alarmRate,
          itemStyle: { color: monitorTypeColors[s.monitorType] || '#1890ff' },
        })),
        label: { show: true, position: 'right', formatter: '{c}%' },
      }],
    }
  }, [summaryData])

  // 监测类型饼图
  const typePieOption = useMemo(() => {
    const typeCountMap = new Map<string, number>()
    for (const s of summaryData) {
      typeCountMap.set(s.monitorType, (typeCountMap.get(s.monitorType) || 0) + 1)
    }
    const data = Array.from(typeCountMap.entries()).map(([name, value]) => ({
      name, value,
      itemStyle: { color: monitorTypeColors[name] || '#999' },
    }))
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data,
        label: { show: true, formatter: '{b}\n{d}%' },
      }],
    }
  }, [summaryData])

  // 统计表格列
  const columns = [
    { title: '仪表编号', dataIndex: 'instrumentId', key: 'instrumentId', width: 100 },
    { title: '安装位置', dataIndex: 'location', key: 'location', width: 140 },
    {
      title: '监测类型', dataIndex: 'monitorType', key: 'monitorType', width: 120,
      render: (v: string) => <Tag color={monitorTypeColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '平均值', dataIndex: 'avg', key: 'avg', width: 100,
      render: (v: number, r: InstrumentSummaryItem) => `${v} ${r.unit}`,
    },
    {
      title: '最大值', dataIndex: 'max', key: 'max', width: 100,
      render: (v: number, r: InstrumentSummaryItem) => `${v} ${r.unit}`,
    },
    {
      title: '最小值', dataIndex: 'min', key: 'min', width: 100,
      render: (v: number, r: InstrumentSummaryItem) => `${v} ${r.unit}`,
    },
    {
      title: '标准差', dataIndex: 'stdDev', key: 'stdDev', width: 80,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '报警率', dataIndex: 'alarmRate', key: 'alarmRate', width: 90,
      render: (v: number) => (
        <Tag color={v > 20 ? 'red' : v > 10 ? 'orange' : v > 0 ? 'gold' : 'green'}>
          {v}%
        </Tag>
      ),
      sorter: (a: InstrumentSummaryItem, b: InstrumentSummaryItem) => a.alarmRate - b.alarmRate,
    },
    { title: '数据点', dataIndex: 'dataPoints', key: 'dataPoints', width: 80 },
  ]

  if (loading && historyData.length === 0) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div>
      {/* 筛选 */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <span>监测类型:</span>
          <Select
            mode="multiple"
            placeholder="全部类型"
            style={{ minWidth: 300 }}
            value={selectedTypes}
            onChange={setSelectedTypes}
            allowClear
            options={monitorTypes.map(t => ({ label: t, value: t }))}
          />
          <span>时间粒度:</span>
          <Radio.Group value={interval} onChange={e => setInterval(e.target.value)} optionType="button" size="small">
            <Radio.Button value="minute">分钟</Radio.Button>
            <Radio.Button value="hour">小时</Radio.Button>
            <Radio.Button value="day">天</Radio.Button>
          </Radio.Group>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="监测点总数" value={stats.total} prefix={<MonitorOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="正常" value={stats.normal} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="报警中" value={stats.alarming} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="故障/离线" value={stats.faultOffline} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#999' }} /></Card>
        </Col>
      </Row>

      {/* 趋势图 - 按监测类型分组 */}
      {trendOptionsByType.length > 0 ? (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {trendOptionsByType.map(({ type, unit, option }) => (
            <Col span={trendOptionsByType.length === 1 ? 24 : 12} key={type} style={{ marginBottom: 16 }}>
              <Card
                title={<span>{type} <span style={{ color: '#999', fontSize: 12 }}>({unit})</span></span>}
                size="small"
                extra={<Tag color={monitorTypeColors[type] || 'default'}>{type}</Tag>}
              >
                <ReactECharts option={option} style={{ height: 280 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card title="监测参数趋势" size="small" style={{ marginBottom: 16 }}>
          <Empty description="暂无数据" />
        </Card>
      )}

      {/* 报警率 + 类型分布 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card title="仪表报警率对比" size="small">
            {summaryData.some(s => s.alarmRate > 0) ? (
              <ReactECharts option={alarmBarOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无报警数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card title="监测类型分布" size="small">
            {summaryData.length > 0 ? (
              <ReactECharts option={typePieOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 统计表格 */}
      <Card title="仪表数据统计" size="small">
        <Table
          dataSource={summaryData}
          columns={columns}
          rowKey="instrumentId"
          size="small"
          pagination={false}
          scroll={{ x: 1000 }}
          loading={loading}
        />
      </Card>
    </div>
  )
}

export default MonitorAnalysis
