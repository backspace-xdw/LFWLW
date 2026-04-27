import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card,
  Row,
  Col,
  Tag,
  Table,
  Progress,
  Space,
  Button,
  Statistic,
  Tooltip,
  Badge,
  List,
  Alert,
  Input,
  Select,
  Drawer,
  Slider,
  Divider,
  message,
  Empty,
} from 'antd'
import {
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  WarningOutlined,
  FireOutlined,
  ReloadOutlined,
  DashboardOutlined,
  AlertOutlined,
  SearchOutlined,
  SettingOutlined,
  DownloadOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ReactECharts from 'echarts-for-react'
import request from '@/utils/request'
import styles from './index.module.scss'

// ─── Types ───────────────────────────────────────────────────────

interface RiskFactors {
  proximity: number
  volatility: number
  trend: number
  deviceHealth: number
  alarmHistory: number
  correlation: number
}

interface InstrumentRisk {
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  deviceId: string
  currentValue: number | null
  deviceStatus: string
  alarmStatus: string
  rangeMin: number
  rangeMax: number
  threshold: {
    lowLow: number | null
    low: number | null
    high: number | null
    highHigh: number | null
  }
  factors: RiskFactors
  compositeScore: number
  riskLevel: string
  riskLevelText: string
  riskDescriptions: string[]
  timestamp: string
}

interface RiskSummary {
  overallScore: number
  overallLevel: string
  overallLevelText: string
  instrumentCount: number
  safeCount: number
  watchCount: number
  warningCount: number
  dangerCount: number
  topRisks: InstrumentRisk[]
  timestamp: string
}

interface TrendPoint {
  timestamp: string
  instrumentId: string
  compositeScore: number
  riskLevel: string
}

interface WeightConfig {
  proximity: number
  volatility: number
  trend: number
  deviceHealth: number
  alarmHistory: number
  correlation: number
}

// ─── Helpers ─────────────────────────────────────────────────────

const levelColorMap: Record<string, string> = {
  safe: '#52c41a',
  watch: '#faad14',
  warning: '#fa8c16',
  danger: '#ff4d4f',
}

const levelTagMap: Record<string, { color: string; text: string }> = {
  safe: { color: 'success', text: '安全' },
  watch: { color: 'warning', text: '关注' },
  warning: { color: 'orange', text: '预警' },
  danger: { color: 'error', text: '危险' },
}

const monitorColorMap: Record<string, string> = {
  '液位': 'blue',
  '温度': 'volcano',
  '压力': 'purple',
  '流量': 'cyan',
  '可燃气体': 'orange',
  '有毒气体': 'red',
}

function getMonitorColor(type: string): string {
  return Object.entries(monitorColorMap).find(([k]) => type.includes(k))?.[1] || 'default'
}

const factorNames: Record<string, string> = {
  proximity: '阈值接近度',
  volatility: '波动性',
  trend: '趋势分析',
  deviceHealth: '设备健康',
  alarmHistory: '告警历史',
  correlation: '关联分析',
}

const factorDescriptions: Record<string, string> = {
  proximity: '当前值距最近阈值的距离，越近分数越高',
  volatility: '近期数据读数的波动程度',
  trend: '值的变化方向是否趋向阈值',
  deviceHealth: '设备在线状态和健康程度',
  alarmHistory: '近1小时内的告警频率',
  correlation: '同区域关联仪表的联动风险',
}

// ─── Component ───────────────────────────────────────────────────

const RiskWarning: React.FC = () => {
  const [summary, setSummary] = useState<RiskSummary | null>(null)
  const [assessments, setAssessments] = useState<InstrumentRisk[]>([])
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 筛选状态
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterMonitor, setFilterMonitor] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [heatmapSort, setHeatmapSort] = useState<'desc' | 'asc'>('desc')

  // 权重配置
  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false)
  const [weights, setWeights] = useState<WeightConfig>({
    proximity: 25, volatility: 12, trend: 23,
    deviceHealth: 15, alarmHistory: 13, correlation: 12,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sumRes, trendRes, assessRes] = await Promise.all([
        request.get('/api/v1/risk-warning/summary'),
        request.get('/api/v1/risk-warning/trend', { params: { count: 100 } }),
        request.get('/api/v1/risk-warning/assessments'),
      ])

      const sumData = sumRes?.data?.data || sumRes?.data
      const trendDataRaw = trendRes?.data?.data || trendRes?.data
      const assessData = assessRes?.data?.data || assessRes?.data

      if (sumData) setSummary(sumData)
      if (Array.isArray(trendDataRaw)) setTrendData(trendDataRaw)
      if (Array.isArray(assessData)) {
        setAssessments(assessData)
        setSelectedId(prev => prev || (assessData.length > 0 ? assessData[0].instrumentId : ''))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const loadWeights = useCallback(async () => {
    try {
      const res = await request.get('/api/v1/risk-warning/config')
      const cfg = res?.data?.data || res?.data
      if (cfg) {
        setWeights({
          proximity: Math.round(cfg.proximity * 100),
          volatility: Math.round(cfg.volatility * 100),
          trend: Math.round(cfg.trend * 100),
          deviceHealth: Math.round(cfg.deviceHealth * 100),
          alarmHistory: Math.round(cfg.alarmHistory * 100),
          correlation: Math.round(cfg.correlation * 100),
        })
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadData()
    loadWeights()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(loadData, 15000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [autoRefresh, loadData])

  // 筛选后的数据
  const filteredAssessments = assessments.filter(a => {
    if (filterLevel !== 'all' && a.riskLevel !== filterLevel) return false
    if (filterMonitor !== 'all' && !a.monitorType.includes(filterMonitor)) return false
    if (searchText) {
      const s = searchText.toLowerCase()
      return a.instrumentId.toLowerCase().includes(s)
        || a.location.toLowerCase().includes(s)
        || a.monitorType.toLowerCase().includes(s)
    }
    return true
  })

  // 热力图排序
  const sortedHeatmapData = [...filteredAssessments].sort((a, b) =>
    heatmapSort === 'desc'
      ? b.compositeScore - a.compositeScore
      : a.compositeScore - b.compositeScore
  )

  const selected = assessments.find(a => a.instrumentId === selectedId) || assessments[0]

  // 获取所有不重复的监测类型
  const monitorTypes = Array.from(new Set(assessments.map(a => {
    const found = Object.keys(monitorColorMap).find(k => a.monitorType.includes(k))
    return found || a.monitorType
  })))

  // 权重总和
  const weightSum = Object.values(weights).reduce((s, v) => s + v, 0)

  // ─── 保存权重 ─────────────────────────────────────────────
  const saveWeights = async () => {
    try {
      const normalized: Record<string, number> = {}
      for (const [k, v] of Object.entries(weights)) {
        normalized[k] = v / weightSum
      }
      await request.put('/api/v1/risk-warning/config', normalized)
      message.success('权重配置已保存，下次刷新时生效')
      setWeightDrawerOpen(false)
      loadData()
    } catch {
      message.error('保存失败')
    }
  }

  // ─── 导出CSV ────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['仪表编号', '安装位置', '监测类型', '当前值', '单位', '风险分数', '风险等级', '设备状态', '主要因子', '风险描述']
    const rows = filteredAssessments.map(a => {
      const entries = Object.entries(a.factors) as [string, number][]
      entries.sort((x, y) => y[1] - x[1])
      const topFactor = entries[0] ? factorNames[entries[0][0]] : '-'
      return [
        a.instrumentId,
        a.location,
        a.monitorType,
        a.currentValue ?? '离线',
        a.unit,
        a.compositeScore,
        a.riskLevelText,
        a.deviceStatus === 'normal' ? '正常' : a.deviceStatus === 'fault' ? '故障' : '离线',
        topFactor,
        a.riskDescriptions.join('；'),
      ].join(',')
    })
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `风险评估_${new Date().toLocaleDateString()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    message.success('导出成功')
  }

  // ─── Radar Chart ─────────────────────────────────────────────

  const radarOption = selected ? {
    tooltip: {},
    radar: {
      indicator: [
        { name: '阈值接近度', max: 100 },
        { name: '波动性', max: 100 },
        { name: '趋势分析', max: 100 },
        { name: '设备健康', max: 100 },
        { name: '告警历史', max: 100 },
        { name: '关联分析', max: 100 },
      ],
      shape: 'circle' as const,
      splitNumber: 4,
      axisName: { color: '#666', fontSize: 12 },
      splitArea: {
        areaStyle: {
          color: ['rgba(82,196,26,0.05)', 'rgba(250,173,20,0.05)', 'rgba(250,140,22,0.08)', 'rgba(255,77,79,0.08)'],
        },
      },
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          selected.factors.proximity,
          selected.factors.volatility,
          selected.factors.trend,
          selected.factors.deviceHealth,
          selected.factors.alarmHistory,
          selected.factors.correlation,
        ],
        name: selected.instrumentId,
        areaStyle: {
          color: `${levelColorMap[selected.riskLevel] || '#1890ff'}33`,
        },
        lineStyle: {
          color: levelColorMap[selected.riskLevel] || '#1890ff',
          width: 2,
        },
        itemStyle: {
          color: levelColorMap[selected.riskLevel] || '#1890ff',
        },
      }],
    }],
  } : {}

  // ─── Trend Chart ─────────────────────────────────────────────

  const buildTrendOption = () => {
    const groups: Record<string, TrendPoint[]> = {}
    for (const p of trendData) {
      if (!groups[p.instrumentId]) groups[p.instrumentId] = []
      groups[p.instrumentId].push(p)
    }

    const top5 = assessments.slice(0, 5).map(a => a.instrumentId)
    const colors = ['#ff4d4f', '#fa8c16', '#faad14', '#1890ff', '#52c41a']

    const series = top5.map((id, idx) => {
      const points = groups[id] || []
      return {
        name: id,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        color: colors[idx],
        data: points.map(p => [p.timestamp, p.compositeScore]),
      }
    })

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!params?.length) return ''
          let html = `<div style="font-size:12px">${new Date(params[0].value[0]).toLocaleTimeString()}</div>`
          for (const p of params) {
            html += `<div>${p.marker} ${p.seriesName}: <b>${p.value[1]}分</b></div>`
          }
          return html
        },
      },
      legend: {
        data: top5,
        textStyle: { fontSize: 12 },
        bottom: 0,
      },
      grid: { top: 10, right: 20, bottom: 35, left: 45 },
      xAxis: {
        type: 'time',
        axisLabel: { fontSize: 11, formatter: '{HH}:{mm}:{ss}' },
      },
      yAxis: {
        type: 'value',
        name: '风险分',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { fontSize: 11 },
      },
      visualMap: {
        show: false,
        pieces: [
          { lte: 25, color: '#52c41a' },
          { gt: 25, lte: 50, color: '#faad14' },
          { gt: 50, lte: 75, color: '#fa8c16' },
          { gt: 75, color: '#ff4d4f' },
        ],
      },
      series,
    }
  }

  // ─── Distribution Chart ──────────────────────────────────────

  const buildDistributionOption = () => {
    if (!summary) return {}
    const data = [
      { name: '安全', value: summary.safeCount, itemStyle: { color: '#52c41a' } },
      { name: '关注', value: summary.watchCount, itemStyle: { color: '#faad14' } },
      { name: '预警', value: summary.warningCount, itemStyle: { color: '#fa8c16' } },
      { name: '危险', value: summary.dangerCount, itemStyle: { color: '#ff4d4f' } },
    ].filter(d => d.value > 0)

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      series: [{
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          formatter: '{b}\n{c}台',
          fontSize: 12,
        },
        emphasis: {
          label: { fontSize: 14, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
        },
        data,
      }],
    }
  }

  // ─── Gauge Option ──────────────────────────────────────────────

  const gaugeOption = summary ? {
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 10,
      radius: '90%',
      center: ['50%', '55%'],
      axisLine: {
        lineStyle: {
          width: 16,
          color: [
            [0.25, '#52c41a'],
            [0.5, '#faad14'],
            [0.75, '#fa8c16'],
            [1, '#ff4d4f'],
          ],
        },
      },
      pointer: {
        itemStyle: { color: 'auto' },
        width: 4,
        length: '60%',
      },
      axisTick: { distance: -16, length: 6, lineStyle: { color: '#fff', width: 1 } },
      splitLine: { distance: -18, length: 16, lineStyle: { color: '#fff', width: 2 } },
      axisLabel: { color: '#999', distance: 22, fontSize: 11 },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        color: levelColorMap[summary.overallLevel] || '#333',
        fontSize: 32,
        fontWeight: 700,
        offsetCenter: [0, '40%'],
      },
      title: {
        offsetCenter: [0, '65%'],
        fontSize: 15,
        color: levelColorMap[summary.overallLevel] || '#333',
        fontWeight: 600,
      },
      data: [{
        value: summary.overallScore,
        name: summary.overallLevelText,
      }],
    }],
  } : {}

  // ─── Factor Bar Chart for selected instrument ──────────────────

  const buildFactorBarOption = () => {
    if (!selected) return {}
    const factorKeys = ['proximity', 'volatility', 'trend', 'deviceHealth', 'alarmHistory', 'correlation'] as const
    const data = factorKeys.map(k => ({
      name: factorNames[k],
      value: Math.round(selected.factors[k]),
    }))
    // 按分数从高到低排列
    data.sort((a, b) => b.value - a.value)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0]
          return `${p.name}: <b>${p.value}分</b>`
        },
      },
      grid: { top: 8, right: 30, bottom: 0, left: 80 },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLabel: { fontSize: 12 },
        inverse: true,
      },
      series: [{
        type: 'bar',
        data: data.map(d => ({
          value: d.value,
          itemStyle: {
            color: d.value >= 75 ? '#ff4d4f' : d.value >= 50 ? '#fa8c16' : d.value >= 25 ? '#faad14' : '#52c41a',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: 18,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          fontSize: 12,
          fontWeight: 600,
        },
      }],
    }
  }

  // ─── Table Columns ─────────────────────────────────────────────

  const columns: ColumnsType<InstrumentRisk> = [
    {
      title: '仪表编号',
      dataIndex: 'instrumentId',
      key: 'instrumentId',
      width: 100,
      fixed: 'left',
      render: (id: string) => <span style={{ fontWeight: 600 }}>{id}</span>,
    },
    {
      title: '安装位置',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      ellipsis: true,
    },
    {
      title: '监测类型',
      dataIndex: 'monitorType',
      key: 'monitorType',
      width: 120,
      filters: monitorTypes.map(t => ({ text: t, value: t })),
      onFilter: (value, record) => record.monitorType.includes(value as string),
      render: (type: string) => <Tag color={getMonitorColor(type)}>{type}</Tag>,
    },
    {
      title: '当前值',
      key: 'currentValue',
      width: 120,
      render: (_: unknown, r: InstrumentRisk) => (
        r.currentValue !== null
          ? <span style={{ fontWeight: 600 }}>{r.currentValue} <span style={{ color: '#999', fontWeight: 400 }}>{r.unit}</span></span>
          : <Tag>离线</Tag>
      ),
    },
    {
      title: '风险分数',
      dataIndex: 'compositeScore',
      key: 'compositeScore',
      width: 160,
      sorter: (a, b) => a.compositeScore - b.compositeScore,
      defaultSortOrder: 'descend',
      render: (score: number, r: InstrumentRisk) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={levelColorMap[r.riskLevel]}
          format={() => `${score}`}
        />
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 90,
      filters: [
        { text: '安全', value: 'safe' },
        { text: '关注', value: 'watch' },
        { text: '预警', value: 'warning' },
        { text: '危险', value: 'danger' },
      ],
      onFilter: (value, record) => record.riskLevel === value,
      render: (level: string) => {
        const tag = levelTagMap[level] || { color: 'default', text: level }
        return <Tag color={tag.color}>{tag.text}</Tag>
      },
    },
    {
      title: '主要因子',
      key: 'topFactor',
      width: 130,
      render: (_: unknown, r: InstrumentRisk) => {
        const entries = Object.entries(r.factors) as [string, number][]
        entries.sort((a, b) => b[1] - a[1])
        const top = entries[0]
        if (!top || top[1] === 0) return <span style={{ color: '#999' }}>-</span>
        return (
          <Tooltip title={`${factorNames[top[0]]}: ${top[1].toFixed(0)}分`}>
            <Tag>{factorNames[top[0]]}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: '设备状态',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      width: 90,
      filters: [
        { text: '正常', value: 'normal' },
        { text: '故障', value: 'fault' },
        { text: '离线', value: 'offline' },
      ],
      onFilter: (value, record) => record.deviceStatus === value,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          normal: { color: 'success', text: '正常' },
          fault: { color: 'error', text: '故障' },
          offline: { color: 'default', text: '离线' },
        }
        const s = map[status] || { color: 'default', text: status }
        return <Badge status={s.color as any} text={s.text} />
      },
    },
    {
      title: '风险描述',
      dataIndex: 'riskDescriptions',
      key: 'riskDescriptions',
      width: 260,
      ellipsis: true,
      render: (descs: string[]) => (
        <Tooltip title={descs.join('；')}>
          <span style={{ color: '#666' }}>{descs[0]}</span>
        </Tooltip>
      ),
    },
  ]

  return (
    <div className={styles.riskWarning}>
      {/* 顶部操作栏 */}
      <div className={styles.topBar}>
        <Space>
          <ThunderboltOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1d2129' }}>风险预警中心</span>
          {summary && (
            <Tag color={levelTagMap[summary.overallLevel]?.color} style={{ fontSize: 13, padding: '2px 10px' }}>
              整体: {summary.overallLevelText}
            </Tag>
          )}
        </Space>
        <Space size={8}>
          <Input
            placeholder="搜索仪表/位置"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            size="small"
            style={{ width: 160 }}
            allowClear
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Select
            size="small"
            style={{ width: 100 }}
            value={filterLevel}
            onChange={setFilterLevel}
            options={[
              { label: '全部等级', value: 'all' },
              { label: '危险', value: 'danger' },
              { label: '预警', value: 'warning' },
              { label: '关注', value: 'watch' },
              { label: '安全', value: 'safe' },
            ]}
          />
          <Select
            size="small"
            style={{ width: 100 }}
            value={filterMonitor}
            onChange={setFilterMonitor}
            options={[
              { label: '全部类型', value: 'all' },
              ...monitorTypes.map(t => ({ label: t, value: t })),
            ]}
          />
          <Divider type="vertical" style={{ margin: '0 4px' }} />
          <Tooltip title="导出CSV">
            <Button icon={<DownloadOutlined />} size="small" onClick={exportCSV} />
          </Tooltip>
          <Tooltip title="权重配置">
            <Button icon={<SettingOutlined />} size="small" onClick={() => setWeightDrawerOpen(true)} />
          </Tooltip>
          <Button
            type={autoRefresh ? 'primary' : 'default'}
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '自动刷新(15s)' : '已暂停'}
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={loadData} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 统计概览 */}
      <Row gutter={12} className={styles.summaryRow}>
        <Col xs={24} sm={8} md={5}>
          <Card className={styles.overallCard}>
            {summary && (
              <ReactECharts option={gaugeOption} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={16} md={13}>
          <Row gutter={12}>
            <Col xs={12} sm={6}>
              <Card className={`${styles.statCard} ${styles.statSafe}`} hoverable onClick={() => setFilterLevel(filterLevel === 'safe' ? 'all' : 'safe')}>
                <Statistic
                  title="安全"
                  value={summary?.safeCount || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className={`${styles.statCard} ${styles.statWatch}`} hoverable onClick={() => setFilterLevel(filterLevel === 'watch' ? 'all' : 'watch')}>
                <Statistic
                  title="关注"
                  value={summary?.watchCount || 0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<EyeOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className={`${styles.statCard} ${styles.statWarning}`} hoverable onClick={() => setFilterLevel(filterLevel === 'warning' ? 'all' : 'warning')}>
                <Statistic
                  title="预警"
                  value={summary?.warningCount || 0}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className={`${styles.statCard} ${styles.statDanger}`} hoverable onClick={() => setFilterLevel(filterLevel === 'danger' ? 'all' : 'danger')}>
                <Statistic
                  title="危险"
                  value={summary?.dangerCount || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<FireOutlined />}
                />
              </Card>
            </Col>
          </Row>
          {/* 高风险提示 */}
          {summary && summary.dangerCount > 0 && (
            <Alert
              style={{ marginTop: 8, borderRadius: 8 }}
              type="error"
              showIcon
              message={`${summary.dangerCount}个仪表处于危险状态，请立即关注！`}
              description={summary.topRisks
                .filter(r => r.riskLevel === 'danger')
                .map(r => `${r.instrumentId} ${r.location} - ${r.riskDescriptions[0]}`)
                .join('；')}
            />
          )}
          {summary && summary.warningCount > 0 && summary.dangerCount === 0 && (
            <Alert
              style={{ marginTop: 8, borderRadius: 8 }}
              type="warning"
              showIcon
              message={`${summary.warningCount}个仪表处于预警状态`}
            />
          )}
        </Col>
        {/* 风险分布饼图 */}
        <Col xs={24} md={6}>
          <Card className={styles.distributionCard} title={<span style={{ fontSize: 14 }}><FilterOutlined /> 风险分布</span>}>
            {summary && summary.instrumentCount > 0 ? (
              <ReactECharts option={buildDistributionOption()} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" style={{ marginTop: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 仪表风险热力图 */}
      <Card
        className={styles.heatmapCard}
        title={
          <Space>
            <DashboardOutlined />
            <span>仪表风险概览</span>
            <Tag>{filteredAssessments.length}台</Tag>
          </Space>
        }
        extra={
          <Space size={8}>
            <span style={{ fontSize: 12, color: '#999' }}>点击卡片查看因子分析</span>
            <Tooltip title={heatmapSort === 'desc' ? '风险降序' : '风险升序'}>
              <Button
                type="text"
                size="small"
                icon={heatmapSort === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                onClick={() => setHeatmapSort(heatmapSort === 'desc' ? 'asc' : 'desc')}
              />
            </Tooltip>
          </Space>
        }
      >
        {sortedHeatmapData.length > 0 ? (
          <div className={styles.heatmapGrid}>
            {sortedHeatmapData.map(a => (
              <div
                key={a.instrumentId}
                className={`${styles.riskItem} ${styles[a.riskLevel]} ${selectedId === a.instrumentId ? styles.selected : ''}`}
                onClick={() => setSelectedId(a.instrumentId)}
              >
                <div className={styles.riskItemHeader}>
                  <span className={styles.instrumentId}>{a.instrumentId}</span>
                  <Tag color={levelTagMap[a.riskLevel]?.color}>{a.riskLevelText}</Tag>
                </div>
                <div className={styles.riskItemBody}>
                  <div className={styles.location}>
                    <Tag color={getMonitorColor(a.monitorType)} style={{ marginRight: 4 }}>{a.monitorType}</Tag>
                    {a.location}
                  </div>
                  <div className={styles.valueRow}>
                    <span className={styles.currentValue}>
                      {a.currentValue !== null ? `${a.currentValue} ${a.unit}` : '离线'}
                    </span>
                    <Badge
                      status={a.deviceStatus === 'normal' ? 'success' : a.deviceStatus === 'fault' ? 'error' : 'default'}
                      text={a.deviceStatus === 'normal' ? '正常' : a.deviceStatus === 'fault' ? '故障' : '离线'}
                    />
                  </div>
                  <Progress
                    percent={a.compositeScore}
                    size="small"
                    strokeColor={levelColorMap[a.riskLevel]}
                    format={() => `${a.compositeScore}分`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配仪表" />
        )}
      </Card>

      {/* 图表区 */}
      <div className={styles.chartsRow}>
        <Card
          className={styles.radarCard}
          title={
            <Space>
              <AlertOutlined />
              <span>风险因子分析</span>
              {selected && <Tag color={levelTagMap[selected.riskLevel]?.color}>{selected.instrumentId} - {selected.riskLevelText}</Tag>}
            </Space>
          }
        >
          {selected ? (
            <div className={styles.factorAnalysis}>
              <div className={styles.factorCharts}>
                <ReactECharts option={radarOption} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
                <ReactECharts option={buildFactorBarOption()} style={{ height: 200 }} opts={{ renderer: 'svg' }} />
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <List
                size="small"
                dataSource={selected.riskDescriptions}
                renderItem={(desc) => (
                  <List.Item style={{ padding: '4px 0', fontSize: 13, color: '#666', borderBottom: 'none' }}>
                    <WarningOutlined style={{ color: levelColorMap[selected.riskLevel], marginRight: 6 }} />
                    {desc}
                  </List.Item>
                )}
              />
            </div>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              选择仪表查看因子分析
            </div>
          )}
        </Card>

        <Card className={styles.trendCard} title={<><ThunderboltOutlined /> 风险趋势 (Top 5)</>}>
          {trendData.length > 0 ? (
            <ReactECharts option={buildTrendOption()} style={{ height: 440 }} opts={{ renderer: 'svg' }} />
          ) : (
            <div style={{ height: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              数据积累中，趋势图将在多次刷新后显示...
            </div>
          )}
        </Card>
      </div>

      {/* 详细表格 */}
      <Card className={styles.detailCard} title={
        <Space>
          <span>全部仪表风险评估明细</span>
          <Tag>{filteredAssessments.length}/{assessments.length}</Tag>
        </Space>
      }>
        <Table<InstrumentRisk>
          columns={columns}
          dataSource={filteredAssessments}
          rowKey="instrumentId"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={filteredAssessments.length > 15 ? { pageSize: 15, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` } : false}
          size="middle"
          rowClassName={(r) => {
            if (r.riskLevel === 'danger') return styles.dangerRow
            if (r.riskLevel === 'warning') return styles.warningRow
            return ''
          }}
        />
      </Card>

      {/* 权重配置抽屉 */}
      <Drawer
        title={
          <Space>
            <SettingOutlined />
            <span>风险评估权重配置</span>
          </Space>
        }
        open={weightDrawerOpen}
        onClose={() => setWeightDrawerOpen(false)}
        width={420}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setWeightDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={saveWeights}>
                保存配置
              </Button>
            </Space>
          </div>
        }
      >
        <Alert
          message="调整各维度的权重比例，权重总和会自动归一化为100%"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        {(Object.keys(weights) as (keyof WeightConfig)[]).map((key) => (
          <div key={key} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Space>
                <span style={{ fontWeight: 600 }}>{factorNames[key]}</span>
                <Tooltip title={factorDescriptions[key]}>
                  <InfoCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
              <span style={{ color: '#1890ff', fontWeight: 600 }}>
                {weights[key]}%
                {weightSum !== 100 && (
                  <span style={{ color: '#999', fontWeight: 400, marginLeft: 4 }}>
                    (实际 {(weights[key] / weightSum * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            <Slider
              min={0}
              max={50}
              value={weights[key]}
              onChange={(v) => setWeights(prev => ({ ...prev, [key]: v }))}
              trackStyle={{ background: '#1890ff' }}
            />
          </div>
        ))}
        <Divider />
        <div style={{ textAlign: 'center', color: weightSum === 100 ? '#52c41a' : '#fa8c16' }}>
          权重总和: {weightSum}%
          {weightSum !== 100 && <span style={{ marginLeft: 8 }}>(保存时自动归一化)</span>}
        </div>
      </Drawer>
    </div>
  )
}

export default RiskWarning
