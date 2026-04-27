import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Statistic, Select, Table, Spin, Empty, Tag, Space, message, Progress } from 'antd'
import {
  ThunderboltOutlined,
  WarningOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import request from '@/utils/request'

interface Props {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
  refreshKey: number
}

interface RiskData {
  overallTrend: { timestamp: string; score: number; level: string }[]
  instrumentTrends: {
    instrumentId: string
    location: string
    monitorType: string
    trend: { timestamp: string; score: number }[]
  }[]
  factorAverages: { factor: string; factorName: string; avgScore: number }[]
  levelDistribution: { timestamp: string; safe: number; watch: number; warning: number; danger: number }[]
  currentAssessments: any[]
}

const riskLevelColors: Record<string, string> = {
  safe: '#52c41a', watch: '#fadb14', warning: '#fa8c16', danger: '#ff4d4f',
}
const riskLevelText: Record<string, string> = {
  safe: '安全', watch: '关注', warning: '预警', danger: '危险',
}

const RiskAnalysis: React.FC<Props> = ({ dateRange, refreshKey }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RiskData | null>(null)
  const [selectedInstrument, setSelectedInstrument] = useState<string | undefined>(undefined)
  const [riskSummary, setRiskSummary] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [refreshKey, selectedInstrument])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {
        startTime: dateRange[0].toISOString(),
        endTime: dateRange[1].toISOString(),
      }
      if (selectedInstrument) params.instrumentIds = selectedInstrument

      const [riskRes, summaryRes] = await Promise.all([
        request.get('/api/v1/analysis/risk-analysis', { params }),
        request.get('/api/v1/risk-warning/summary'),
      ])

      setData((riskRes as any)?.data?.data || null)
      setRiskSummary((summaryRes as any)?.data?.data || (summaryRes as any)?.data || null)
    } catch {
      message.error('加载风险分析数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 风险仪表盘
  const gaugeOption = useMemo(() => {
    const score = riskSummary?.overallScore || 0
    return {
      series: [{
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        splitNumber: 4,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[0.25, '#52c41a'], [0.5, '#fadb14'], [0.75, '#fa8c16'], [1, '#ff4d4f']],
          },
        },
        pointer: { itemStyle: { color: 'auto' }, width: 4 },
        axisTick: { show: false },
        splitLine: { length: 12, lineStyle: { width: 2, color: '#999' } },
        axisLabel: { distance: 25, fontSize: 11 },
        detail: { valueAnimation: true, formatter: '{value}', fontSize: 28, fontWeight: 'bold', offsetCenter: [0, '70%'] },
        data: [{ value: score }],
      }],
    }
  }, [riskSummary])

  // 风险趋势线图
  const trendOption = useMemo(() => {
    if (!data) return {}
    const xData = data.overallTrend.map(t => dayjs(t.timestamp).format('MM-DD HH:mm'))
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 10, bottom: 50 },
      xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '风险评分', min: 0, max: 100 },
      visualMap: {
        show: false,
        pieces: [
          { lte: 25, color: '#52c41a' },
          { gt: 25, lte: 50, color: '#fadb14' },
          { gt: 50, lte: 75, color: '#fa8c16' },
          { gt: 75, color: '#ff4d4f' },
        ],
      },
      series: [{
        type: 'line',
        data: data.overallTrend.map(t => t.score),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.15 },
        markLine: {
          silent: true,
          lineStyle: { type: 'dashed' },
          data: [
            { yAxis: 25, label: { formatter: '关注', position: 'end' }, lineStyle: { color: '#fadb14' } },
            { yAxis: 50, label: { formatter: '预警', position: 'end' }, lineStyle: { color: '#fa8c16' } },
            { yAxis: 75, label: { formatter: '危险', position: 'end' }, lineStyle: { color: '#ff4d4f' } },
          ],
        },
      }],
      dataZoom: [{ type: 'slider', start: 0, end: 100 }],
    }
  }, [data])

  // 等级分布堆叠面积图
  const areaOption = useMemo(() => {
    if (!data) return {}
    const xData = data.levelDistribution.map(d => dayjs(d.timestamp).format('MM-DD HH:mm'))
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['危险', '预警', '关注', '安全'], bottom: 0 },
      grid: { left: 50, right: 20, top: 10, bottom: 50 },
      xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '仪表数' },
      series: [
        { name: '危险', type: 'line', stack: 'total', areaStyle: {}, data: data.levelDistribution.map(d => d.danger), itemStyle: { color: '#ff4d4f' } },
        { name: '预警', type: 'line', stack: 'total', areaStyle: {}, data: data.levelDistribution.map(d => d.warning), itemStyle: { color: '#fa8c16' } },
        { name: '关注', type: 'line', stack: 'total', areaStyle: {}, data: data.levelDistribution.map(d => d.watch), itemStyle: { color: '#fadb14' } },
        { name: '安全', type: 'line', stack: 'total', areaStyle: {}, data: data.levelDistribution.map(d => d.safe), itemStyle: { color: '#52c41a' } },
      ],
    }
  }, [data])

  // 六因子雷达图
  const radarOption = useMemo(() => {
    if (!data) return {}
    return {
      radar: {
        indicator: data.factorAverages.map(f => ({ name: f.factorName, max: 100 })),
        shape: 'polygon',
      },
      series: [{
        type: 'radar',
        data: [{
          value: data.factorAverages.map(f => f.avgScore),
          name: '平均风险因子',
          areaStyle: { opacity: 0.3 },
          lineStyle: { width: 2 },
        }],
        itemStyle: { color: '#1890ff' },
      }],
      tooltip: {},
    }
  }, [data])

  // 表格列
  const riskColumns = [
    { title: '仪表编号', dataIndex: 'instrumentId', key: 'instrumentId', width: 90 },
    { title: '安装位置', dataIndex: 'location', key: 'location', width: 130 },
    { title: '监测类型', dataIndex: 'monitorType', key: 'monitorType', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 90, render: (v: number, r: any) => v !== null ? `${v} ${r.unit}` : '-' },
    {
      title: '风险评分', dataIndex: 'compositeScore', key: 'compositeScore', width: 120,
      render: (v: number) => (
        <Progress percent={v} size="small" strokeColor={v >= 75 ? '#ff4d4f' : v >= 50 ? '#fa8c16' : v >= 25 ? '#fadb14' : '#52c41a'} format={p => `${p}`} />
      ),
      sorter: (a: any, b: any) => a.compositeScore - b.compositeScore,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 80,
      render: (v: string) => <Tag color={riskLevelColors[v] || 'default'}>{riskLevelText[v] || v}</Tag>,
    },
    {
      title: '设备状态', dataIndex: 'deviceStatus', key: 'deviceStatus', width: 80,
      render: (v: string) => <Tag color={v === 'normal' ? 'green' : v === 'fault' ? 'red' : 'default'}>{v === 'normal' ? '正常' : v === 'fault' ? '故障' : '离线'}</Tag>,
    },
    { title: '风险描述', dataIndex: 'riskDescriptions', key: 'riskDescriptions', render: (v: string[]) => v?.slice(0, 2).join('；') || '-', ellipsis: true },
  ]

  if (loading && !data) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!data) {
    return <Empty description="暂无数据，请点击查询" />
  }

  const overallLevel = riskSummary?.overallLevel || 'safe'

  return (
    <div>
      {/* 筛选 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>选择仪表:</span>
          <Select
            placeholder="全部仪表"
            style={{ width: 280 }}
            value={selectedInstrument}
            onChange={setSelectedInstrument}
            allowClear
            options={data.currentAssessments.map(a => ({ label: `${a.instrumentId} - ${a.location}`, value: a.instrumentId }))}
          />
        </Space>
      </div>

      {/* 风险概览 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <ReactECharts option={gaugeOption} style={{ height: 180 }} />
            <div style={{ textAlign: 'center' }}>
              <Tag color={riskLevelColors[overallLevel]} style={{ fontSize: 14, padding: '2px 12px' }}>
                {riskLevelText[overallLevel] || overallLevel}
              </Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="危险仪表" value={riskSummary?.dangerCount || 0} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="预警仪表" value={riskSummary?.warningCount || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="关注仪表" value={riskSummary?.watchCount || 0} prefix={<EyeOutlined />} valueStyle={{ color: '#bfbf00' }} /></Card>
        </Col>
      </Row>

      {/* 风险趋势 */}
      <Card title="风险评分趋势" size="small" style={{ marginBottom: 16 }}>
        <ReactECharts option={trendOption} style={{ height: 350 }} />
      </Card>

      {/* 等级分布 + 雷达图 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card title="风险等级分布趋势" size="small">
            <ReactECharts option={areaOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="六维度风险因子" size="small">
            <ReactECharts option={radarOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 仪表详情 */}
      <Card title="仪表风险评估详情" size="small">
        <Table dataSource={data.currentAssessments} columns={riskColumns} rowKey="instrumentId" size="small" pagination={false} scroll={{ x: 1100 }} loading={loading} />
      </Card>
    </div>
  )
}

export default RiskAnalysis
