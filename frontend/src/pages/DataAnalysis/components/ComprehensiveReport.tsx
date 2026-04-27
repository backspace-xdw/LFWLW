import React, { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Statistic, Spin, Empty, Tag, Alert, Divider, Table, Progress, message } from 'antd'
import {
  MonitorOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import request from '@/utils/request'

interface Props {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
  refreshKey: number
}

interface ReportData {
  period: { start: string; end: string }
  instrumentSummary: {
    total: number
    normal: number
    alarming: number
    fault: number
    offline: number
    monitorTypes: { monitorType: string; instrumentCount: number; avgValue: number; alarmRate: number }[]
  }
  alarmSummary: {
    totalAlarms: number
    resolutionRate: number
    avgResponseMinutes: number
    topAlarmInstruments: { instrumentId: string; location: string; count: number }[]
    severityBreakdown: { severity: string; count: number; percentage: number }[]
  }
  riskSummary: {
    overallScore: number
    overallLevel: string
    dangerCount: number
    warningCount: number
    topRiskFactors: { factor: string; name: string; avgScore: number }[]
  }
  recommendations: string[]
}

const riskColors: Record<string, string> = {
  '安全': '#52c41a', '关注': '#fadb14', '预警': '#fa8c16', '危险': '#ff4d4f',
}

const ComprehensiveReport: React.FC<Props> = ({ dateRange, refreshKey }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await request.get('/api/v1/analysis/comprehensive', {
        params: { startTime: dateRange[0].toISOString(), endTime: dateRange[1].toISOString() },
      })
      setData((res as any)?.data?.data || null)
    } catch {
      message.error('加载综合报告失败')
    } finally {
      setLoading(false)
    }
  }

  // 类型柱状图
  const typeBarOption = useMemo(() => {
    if (!data) return {}
    const types = data.instrumentSummary.monitorTypes
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: types.map(t => t.monitorType), axisLabel: { rotate: 20 } },
      yAxis: { type: 'value', name: '仪表数量' },
      series: [{
        type: 'bar',
        data: types.map(t => t.instrumentCount),
        itemStyle: { color: '#1890ff' },
        label: { show: true, position: 'top' },
      }],
    }
  }, [data])

  // 严重等级饼图
  const severityPieOption = useMemo(() => {
    if (!data) return {}
    const colors = ['#ff4d4f', '#fa8c16', '#fadb14', '#1890ff']
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        data: data.alarmSummary.severityBreakdown.filter(s => s.count > 0).map((s, i) => ({
          name: s.severity, value: s.count,
          itemStyle: { color: colors[i % colors.length] },
        })),
        label: { show: true, formatter: '{b}\n{c}' },
      }],
    }
  }, [data])

  // TOP 告警仪表
  const topAlarmOption = useMemo(() => {
    if (!data) return {}
    const top = data.alarmSummary.topAlarmInstruments.slice().reverse()
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 160, right: 40, top: 10, bottom: 10 },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: top.map(i => `${i.instrumentId} ${i.location}`),
        axisLabel: { width: 150, overflow: 'truncate' },
      },
      series: [{
        type: 'bar',
        data: top.map(i => i.count),
        itemStyle: { color: '#ff4d4f' },
        label: { show: true, position: 'right', formatter: '{c}次' },
      }],
    }
  }, [data])

  if (loading && !data) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!data) {
    return <Empty description="暂无数据，请点击查询" />
  }

  const { instrumentSummary: inst, alarmSummary: alarm, riskSummary: risk } = data
  const riskColor = riskColors[risk.overallLevel] || '#52c41a'

  const factorColumns = [
    { title: '风险因子', dataIndex: 'name', key: 'name' },
    {
      title: '平均得分', dataIndex: 'avgScore', key: 'avgScore',
      render: (v: number) => (
        <Progress percent={v} size="small" strokeColor={v >= 60 ? '#ff4d4f' : v >= 40 ? '#fa8c16' : v >= 20 ? '#fadb14' : '#52c41a'} format={p => `${p}`} />
      ),
    },
  ]

  return (
    <div>
      {/* 报告头 */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <span style={{ fontSize: 16, fontWeight: 600 }}>综合分析报告</span>
            <span style={{ marginLeft: 16, color: '#999' }}>
              分析周期: {dayjs(data.period.start).format('YYYY-MM-DD')} ~ {dayjs(data.period.end).format('YYYY-MM-DD')}
            </span>
          </Col>
          <Col><span style={{ color: '#999' }}>生成时间: {dayjs().format('YYYY-MM-DD HH:mm')}</span></Col>
        </Row>
      </Card>

      {/* 监测概况 */}
      <Divider orientation="left" style={{ fontSize: 16 }}><MonitorOutlined /> 监测概况</Divider>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card size="small"><Statistic title="监测点总数" value={inst.total} prefix={<MonitorOutlined />} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="正常" value={inst.normal} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="报警中" value={inst.alarming} valueStyle={{ color: '#ff4d4f' }} prefix={<WarningOutlined />} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="故障" value={inst.fault} valueStyle={{ color: '#fa8c16' }} prefix={<CloseCircleOutlined />} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="离线" value={inst.offline} valueStyle={{ color: '#999' }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="各监测类型仪表数量" size="small">
            <ReactECharts option={typeBarOption} style={{ height: 230 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="各类型报警率" size="small">
            <Table dataSource={inst.monitorTypes} rowKey="monitorType" size="small" pagination={false}
              columns={[
                { title: '监测类型', dataIndex: 'monitorType', key: 'monitorType' },
                { title: '仪表数', dataIndex: 'instrumentCount', key: 'instrumentCount' },
                { title: '平均值', dataIndex: 'avgValue', key: 'avgValue' },
                { title: '报警率', dataIndex: 'alarmRate', key: 'alarmRate', render: (v: number) => <Tag color={v > 15 ? 'red' : v > 5 ? 'orange' : 'green'}>{v}%</Tag> },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 告警概况 */}
      <Divider orientation="left" style={{ fontSize: 16 }}><AlertOutlined /> 告警概况</Divider>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="告警总数" value={alarm.totalAlarms} valueStyle={{ color: '#ff4d4f' }} prefix={<AlertOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="解决率" value={alarm.resolutionRate} suffix="%" valueStyle={{ color: alarm.resolutionRate >= 70 ? '#52c41a' : '#ff4d4f' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="平均响应" value={alarm.avgResponseMinutes} suffix="分钟" prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>整体风险</div>
            <Tag color={riskColor} style={{ fontSize: 18, padding: '4px 16px' }}>{risk.overallLevel} {risk.overallScore}分</Tag>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="严重等级分布" size="small">
            <ReactECharts option={severityPieOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="TOP 5 告警仪表" size="small">
            <ReactECharts option={topAlarmOption} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      {/* 风险概况 */}
      <Divider orientation="left" style={{ fontSize: 16 }}><ThunderboltOutlined /> 风险概况</Divider>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>综合风险评分</div>
            <Progress type="dashboard" percent={risk.overallScore} strokeColor={riskColor} width={100}
              format={p => <span style={{ fontSize: 22, fontWeight: 700, color: riskColor }}>{p}</span>} />
          </Card>
        </Col>
        <Col span={6}><Card size="small"><Statistic title="危险仪表" value={risk.dangerCount} valueStyle={{ color: '#ff4d4f' }} prefix={<ThunderboltOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="预警仪表" value={risk.warningCount} valueStyle={{ color: '#fa8c16' }} prefix={<WarningOutlined />} /></Card></Col>
        <Col span={6}>
          <Card title="主要风险因子" size="small">
            <Table dataSource={risk.topRiskFactors} columns={factorColumns} rowKey="factor" size="small" pagination={false} showHeader={false} />
          </Card>
        </Col>
      </Row>

      {/* 改进建议 */}
      <Divider orientation="left" style={{ fontSize: 16 }}><BulbOutlined /> 分析建议</Divider>
      {data.recommendations.map((rec, idx) => (
        <Alert key={idx} message={rec}
          type={rec.includes('危险') || rec.includes('报警') || rec.includes('解决率') ? 'warning'
            : rec.includes('离线') || rec.includes('故障') ? 'error'
            : rec.includes('正常') || rec.includes('稳定') ? 'success' : 'info'}
          showIcon style={{ marginBottom: 8 }} />
      ))}
    </div>
  )
}

export default ComprehensiveReport
