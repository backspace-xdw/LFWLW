import React, { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Tabs,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Space,
  Button,
  Select,
  Modal,
  Form,
  Input,
  message,
  Switch,
  Empty,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  HeartOutlined,
  HourglassOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  ReloadOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import request from '@/utils/request'
import styles from './index.module.scss'

// ─── Types ───────────────────────────────────────────────────────────

interface DeviceHealth {
  instrumentId: string
  location: string
  monitorType: string
  healthScore: number
  healthLevel: 'excellent' | 'good' | 'warning' | 'critical'
  healthLevelText: string
  factors: {
    runtime: number
    alarmFrequency: number
    trendDeviation: number
    vibration: number
    maintenanceLag: number
  }
  runtimeHours: number
  alarmsLast30Days: number
  lastMaintenance: string | null
  recommendation: string
}

interface HealthSummary {
  total: number
  averageScore: number
  counts: { excellent: number; good: number; warning: number; critical: number }
  topRisk: DeviceHealth[]
}

interface RULPrediction {
  instrumentId: string
  location: string
  monitorType: string
  remainingDays: number
  confidence: number
  predictedFailureDate: string
  degradationRate: number
  trendData: { date: string; health: number }[]
  predictionStartIdx: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface WorkOrder {
  id: string
  title: string
  instrumentId: string
  location: string
  type: string
  typeText: string
  priority: string
  priorityText: string
  status: 'pending' | 'in_progress' | 'pending_review' | 'closed'
  statusText: string
  assignee: string | null
  description: string
  createdAt: string
  scheduledAt: string | null
  cost: number | null
}

interface MaintenancePlan {
  id: string
  name: string
  instrumentId: string
  location: string
  type: 'preventive' | 'predictive'
  typeText: string
  intervalDays: number | null
  healthThreshold: number | null
  responsible: string
  nextRunAt: string
  enabled: boolean
  description: string
}

interface MaintenanceRecord {
  id: string
  instrumentId: string
  location: string
  workOrderId: string | null
  type: string
  typeText: string
  startedAt: string
  completedAt: string
  durationHours: number
  downtimeHours: number
  cost: number
  technician: string
  faultDescription: string
  resolution: string
}

interface KPI {
  totalRecords: number
  totalCost: number
  mtbfDays: number
  mttrHours: number
  totalDowntimeHours: number
  failureRateTrend: { month: string; failures: number; cost: number }[]
  paretoByInstrument: { instrumentId: string; location: string; failures: number }[]
}

interface DeviceOEE {
  instrumentId: string
  location: string
  availability: number
  performance: number
  quality: number
  oee: number
  level: 'world_class' | 'good' | 'average' | 'low'
  levelText: string
}

interface OEESummary {
  overall: {
    availability: number
    performance: number
    quality: number
    oee: number
    level: DeviceOEE['level']
    levelText: string
  }
  devices: DeviceOEE[]
  trend: { month: string; availability: number; performance: number; quality: number; oee: number }[]
  losses: { name: string; hours: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────

const HEALTH_COLOR: Record<DeviceHealth['healthLevel'], string> = {
  excellent: '#52c41a',
  good: '#1890ff',
  warning: '#faad14',
  critical: '#ff4d4f',
}

const STATUS_COLOR: Record<WorkOrder['status'], string> = {
  pending: 'default',
  in_progress: 'processing',
  pending_review: 'warning',
  closed: 'success',
}

const PRIORITY_COLOR: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
}

const RUL_RISK_COLOR: Record<RULPrediction['riskLevel'], string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
}

const OEE_COLOR: Record<DeviceOEE['level'], string> = {
  world_class: '#52c41a',
  good: '#1890ff',
  average: '#faad14',
  low: '#ff4d4f',
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toISOString().slice(0, 10) : '—'

const API = '/api/v1/predictive-maintenance'

// ─── Tab 1: 设备健康度评分 ─────────────────────────────────────────

const HealthTab: React.FC = () => {
  const [summary, setSummary] = useState<HealthSummary | null>(null)
  const [list, setList] = useState<DeviceHealth[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, l] = await Promise.all([
        request.get(`${API}/health/summary`),
        request.get(`${API}/health`),
      ])
      setSummary(s.data.data)
      setList(l.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const factorsRadarOption = (h: DeviceHealth) => ({
    radar: {
      indicator: [
        { name: '运行时长', max: 30 },
        { name: '告警频次', max: 35 },
        { name: '趋势偏离', max: 25 },
        { name: '振动波动', max: 20 },
        { name: '维护滞后', max: 25 },
      ],
      radius: 50,
      axisName: { fontSize: 10 },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              h.factors.runtime,
              h.factors.alarmFrequency,
              h.factors.trendDeviation,
              h.factors.vibration,
              h.factors.maintenanceLag,
            ],
            areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
            lineStyle: { color: '#1890ff' },
          },
        ],
      },
    ],
  })

  return (
    <>
      <Row gutter={[12, 12]} className={styles.summaryRow}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={summary?.total ?? 0}
              prefix={<HeartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="平均健康度"
              value={summary?.averageScore ?? 0}
              suffix="/ 100"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="关注设备"
              value={summary?.counts.warning ?? 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="危险设备"
              value={summary?.counts.critical ?? 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '12px 0' }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          刷新
        </Button>
      </div>

      <Row gutter={[12, 12]}>
        {list.map((h) => (
          <Col key={h.instrumentId} xs={24} sm={12} md={8} lg={6}>
            <Card className={styles.healthCard} size="small">
              <div className={styles.healthHeader}>
                <Space direction="vertical" size={0}>
                  <strong>{h.instrumentId}</strong>
                  <span style={{ fontSize: 12, color: '#888' }}>{h.location}</span>
                </Space>
                <Tag color={HEALTH_COLOR[h.healthLevel]}>{h.healthLevelText}</Tag>
              </div>
              <div className={styles.healthScore} style={{ color: HEALTH_COLOR[h.healthLevel] }}>
                {h.healthScore}
              </div>
              <Progress
                percent={h.healthScore}
                showInfo={false}
                strokeColor={HEALTH_COLOR[h.healthLevel]}
              />
              <ReactECharts option={factorsRadarOption(h)} style={{ height: 140, marginTop: 8 }} />
              <div className={styles.healthMeta}>
                <div>运行时长：{h.runtimeHours.toLocaleString()} h</div>
                <div>近30天告警：{h.alarmsLast30Days} 次</div>
                <div>上次维护：{fmtDate(h.lastMaintenance)}</div>
                <div style={{ color: HEALTH_COLOR[h.healthLevel], marginTop: 4 }}>
                  {h.recommendation}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

// ─── Tab 2: 剩余寿命预测 ─────────────────────────────────────────

const RULTab: React.FC = () => {
  const [list, setList] = useState<RULPrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [riskFilter, setRiskFilter] = useState<string>('all')

  const load = async () => {
    setLoading(true)
    try {
      const r = await request.get(`${API}/rul`)
      setList(r.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => (riskFilter === 'all' ? list : list.filter((r) => r.riskLevel === riskFilter)),
    [list, riskFilter]
  )

  const trendOption = (r: RULPrediction) => {
    const histData = r.trendData.slice(0, r.predictionStartIdx).map((d) => [d.date, d.health])
    const predData = r.trendData.slice(r.predictionStartIdx - 1).map((d) => [d.date, d.health])
    return {
      grid: { top: 30, right: 16, bottom: 30, left: 36 },
      xAxis: { type: 'time', axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { fontSize: 10 } },
      tooltip: { trigger: 'axis' },
      series: [
        {
          name: '历史',
          type: 'line',
          data: histData,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#1890ff' },
          areaStyle: { color: 'rgba(24, 144, 255, 0.15)' },
        },
        {
          name: '预测',
          type: 'line',
          data: predData,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#ff4d4f', type: 'dashed' },
          areaStyle: { color: 'rgba(255, 77, 79, 0.1)' },
        },
        {
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            label: { formatter: '临界 40' },
            lineStyle: { color: '#faad14', type: 'dashed' },
            data: [{ yAxis: 40 }],
          },
        },
      ],
    }
  }

  return (
    <>
      <div className={styles.filterBar}>
        <Select
          value={riskFilter}
          onChange={setRiskFilter}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: '全部风险等级' },
            { value: 'high', label: '高风险（<30天）' },
            { value: 'medium', label: '中风险（<90天）' },
            { value: 'low', label: '低风险' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          刷新
        </Button>
      </div>

      <Row gutter={[12, 12]}>
        {filtered.map((r) => (
          <Col key={r.instrumentId} xs={24} md={12} lg={8}>
            <Card className={styles.rulCard} size="small">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space direction="vertical" size={0}>
                  <strong>{r.instrumentId}</strong>
                  <span style={{ fontSize: 12, color: '#888' }}>{r.location}</span>
                </Space>
                <Tag color={RUL_RISK_COLOR[r.riskLevel]}>
                  {r.riskLevel === 'high' ? '高风险' : r.riskLevel === 'medium' ? '中风险' : '低风险'}
                </Tag>
              </Space>
              <Row gutter={8} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <Statistic
                    title="剩余寿命"
                    value={r.remainingDays}
                    suffix="天"
                    valueStyle={{ color: RUL_RISK_COLOR[r.riskLevel] === 'red' ? '#ff4d4f' : '#1890ff', fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="置信度"
                    value={(r.confidence * 100).toFixed(0)}
                    suffix="%"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="衰减率"
                    value={r.degradationRate}
                    suffix="%/天"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
              </Row>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                预测故障日期：{r.predictedFailureDate}
              </div>
              <ReactECharts option={trendOption(r)} style={{ height: 180, marginTop: 8 }} />
            </Card>
          </Col>
        ))}
        {!filtered.length && <Col span={24}><Empty /></Col>}
      </Row>
    </>
  )
}

// ─── Tab 3: 维护工单 ─────────────────────────────────────────────

const WorkOrderTab: React.FC = () => {
  const [list, setList] = useState<WorkOrder[]>([])
  const [stats, setStats] = useState<{ pending: number; in_progress: number; pending_review: number; closed: number; total: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string | undefined>()
  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const params = filterStatus ? { status: filterStatus } : {}
      const [l, s] = await Promise.all([
        request.get(`${API}/work-orders`, { params }),
        request.get(`${API}/work-orders/stats`),
      ])
      setList(l.data.data)
      setStats(s.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filterStatus])

  const advance = async (order: WorkOrder) => {
    const flow: Record<WorkOrder['status'], WorkOrder['status'] | null> = {
      pending: 'in_progress',
      in_progress: 'pending_review',
      pending_review: 'closed',
      closed: null,
    }
    const next = flow[order.status]
    if (!next) return
    await request.put(`${API}/work-orders/${order.id}/status`, { status: next })
    message.success('工单状态已更新')
    load()
  }

  const onCreate = async () => {
    const values = await form.validateFields()
    await request.post(`${API}/work-orders`, values)
    message.success('工单已创建')
    setCreateOpen(false)
    form.resetFields()
    load()
  }

  const columns: ColumnsType<WorkOrder> = [
    { title: '工单号', dataIndex: 'id', width: 130 },
    { title: '标题', dataIndex: 'title' },
    { title: '设备', dataIndex: 'instrumentId', width: 100 },
    { title: '位置', dataIndex: 'location' },
    {
      title: '类型',
      dataIndex: 'typeText',
      width: 80,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (p: string, r) => <Tag color={PRIORITY_COLOR[p]}>{r.priorityText}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: WorkOrder['status'], r) => <Tag color={STATUS_COLOR[s]}>{r.statusText}</Tag>,
    },
    { title: '负责人', dataIndex: 'assignee', width: 80, render: (v: string | null) => v ?? '—' },
    { title: '创建时间', dataIndex: 'createdAt', width: 110, render: fmtDate },
    {
      title: '操作',
      width: 110,
      render: (_, r) => (
        <Button
          size="small"
          type="link"
          disabled={r.status === 'closed'}
          onClick={() => advance(r)}
        >
          推进至下一阶段
        </Button>
      ),
    },
  ]

  return (
    <>
      <Row gutter={[12, 12]} className={styles.summaryRow}>
        <Col xs={12} md={5}>
          <Card><Statistic title="工单总数" value={stats?.total ?? 0} /></Card>
        </Col>
        <Col xs={12} md={5}>
          <Card><Statistic title="待派单" value={stats?.pending ?? 0} valueStyle={{ color: '#888' }} /></Card>
        </Col>
        <Col xs={12} md={5}>
          <Card><Statistic title="执行中" value={stats?.in_progress ?? 0} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={12} md={5}>
          <Card><Statistic title="待验收" value={stats?.pending_review ?? 0} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={12} md={4}>
          <Card><Statistic title="已关闭" value={stats?.closed ?? 0} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <div className={styles.filterBar} style={{ marginTop: 12 }}>
        <Select
          allowClear
          placeholder="状态筛选"
          style={{ width: 160 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'pending', label: '待派单' },
            { value: 'in_progress', label: '执行中' },
            { value: 'pending_review', label: '待验收' },
            { value: 'closed', label: '已关闭' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建工单
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 10 }}
        size="middle"
        scroll={{ x: 1100 }}
      />

      <Modal
        title="新建维护工单"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={onCreate}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="工单标题" rules={[{ required: true }]}>
            <Input placeholder="如：传感器更换" />
          </Form.Item>
          <Form.Item name="instrumentId" label="设备 ID" rules={[{ required: true }]}>
            <Input placeholder="如：YB-001" />
          </Form.Item>
          <Form.Item name="location" label="位置" rules={[{ required: true }]}>
            <Input placeholder="如：储罐区A-1号储罐" />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="corrective">
            <Select
              options={[
                { value: 'preventive', label: '预防性' },
                { value: 'predictive', label: '预测性' },
                { value: 'corrective', label: '纠正性' },
              ]}
            />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

// ─── Tab 4: 维护计划 ────────────────────────────────────────────

const PlanTab: React.FC = () => {
  const [list, setList] = useState<MaintenancePlan[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await request.get(`${API}/plans`)
      setList(r.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const toggle = async (id: string) => {
    await request.put(`${API}/plans/${id}/toggle`)
    load()
  }

  const columns: ColumnsType<MaintenancePlan> = [
    { title: '计划编号', dataIndex: 'id', width: 100 },
    { title: '名称', dataIndex: 'name' },
    { title: '设备', dataIndex: 'instrumentId', width: 100 },
    { title: '位置', dataIndex: 'location' },
    {
      title: '类型',
      dataIndex: 'type',
      width: 130,
      render: (t: string, r) => (
        <Tag color={t === 'preventive' ? 'blue' : 'purple'}>{r.typeText}</Tag>
      ),
    },
    {
      title: '触发条件',
      width: 160,
      render: (_, r) =>
        r.type === 'preventive'
          ? `每 ${r.intervalDays} 天`
          : `健康度 < ${r.healthThreshold}`,
    },
    { title: '负责人', dataIndex: 'responsible', width: 100 },
    { title: '下次执行', dataIndex: 'nextRunAt', width: 110, render: fmtDate },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      render: (v: boolean, r) => (
        <Switch checked={v} onChange={() => toggle(r.id)} size="small" />
      ),
    },
  ]

  return (
    <>
      <div className={styles.filterBar}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
      </div>
      <Table
        rowKey="id"
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 10 }}
        size="middle"
        scroll={{ x: 1100 }}
      />
    </>
  )
}

// ─── Tab 5: 维护台账 + KPI ─────────────────────────────────────

const HistoryTab: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [oee, setOee] = useState<OEESummary | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [r, k, o] = await Promise.all([
        request.get(`${API}/records`),
        request.get(`${API}/kpi`),
        request.get(`${API}/oee`),
      ])
      setRecords(r.data.data)
      setKpi(k.data.data)
      setOee(o.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const oeeGaugeOption = (value: number, name: string, color: string) => ({
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        radius: '90%',
        min: 0,
        max: 100,
        splitNumber: 4,
        progress: { show: true, width: 12, itemStyle: { color } },
        axisLine: { lineStyle: { width: 12, color: [[1, '#eee']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { offsetCenter: [0, '70%'], fontSize: 13, color: '#666' },
        detail: {
          offsetCenter: [0, '0%'],
          fontSize: 22,
          fontWeight: 700,
          formatter: '{value}%',
          color,
        },
        data: [{ value: +(value * 100).toFixed(1), name }],
      },
    ],
  })

  const oeeTrendOption = useMemo(() => {
    if (!oee) return {}
    return {
      grid: { top: 40, right: 30, bottom: 40, left: 50 },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${(v * 100).toFixed(1)}%` },
      legend: { data: ['可用率', '性能率', '良品率', 'OEE'], top: 0 },
      xAxis: { type: 'category', data: oee.trend.map((t) => t.month) },
      yAxis: {
        type: 'value',
        min: 0.5,
        max: 1,
        axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
      },
      series: [
        { name: '可用率', type: 'line', data: oee.trend.map((t) => t.availability), smooth: true, itemStyle: { color: '#1890ff' } },
        { name: '性能率', type: 'line', data: oee.trend.map((t) => t.performance), smooth: true, itemStyle: { color: '#722ed1' } },
        { name: '良品率', type: 'line', data: oee.trend.map((t) => t.quality), smooth: true, itemStyle: { color: '#13c2c2' } },
        {
          name: 'OEE',
          type: 'line',
          data: oee.trend.map((t) => t.oee),
          smooth: true,
          lineStyle: { width: 3, color: '#fa541c' },
          itemStyle: { color: '#fa541c' },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { formatter: '世界级 85%' },
            lineStyle: { color: '#52c41a', type: 'dashed' },
            data: [{ yAxis: 0.85 }],
          },
        },
      ],
    }
  }, [oee])

  const lossesOption = useMemo(() => {
    if (!oee) return {}
    return {
      grid: { top: 30, right: 20, bottom: 30, left: 80 },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v} h` },
      yAxis: { type: 'category', data: oee.losses.map((l) => l.name).reverse() },
      xAxis: { type: 'value', name: '小时' },
      series: [
        {
          type: 'bar',
          data: oee.losses.map((l) => l.hours).reverse(),
          itemStyle: {
            color: (p: any) => {
              const colors = ['#ff4d4f', '#fa8c16', '#faad14', '#1890ff', '#722ed1', '#13c2c2']
              return colors[p.dataIndex % colors.length]
            },
          },
          label: { show: true, position: 'right', formatter: '{c} h' },
        },
      ],
    }
  }, [oee])

  const oeeColumns: ColumnsType<DeviceOEE> = [
    { title: '设备', dataIndex: 'instrumentId', width: 90 },
    { title: '位置', dataIndex: 'location' },
    {
      title: '可用率',
      dataIndex: 'availability',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
      sorter: (a, b) => a.availability - b.availability,
    },
    {
      title: '性能率',
      dataIndex: 'performance',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
      sorter: (a, b) => a.performance - b.performance,
    },
    {
      title: '良品率',
      dataIndex: 'quality',
      width: 100,
      render: (v: number) => `${(v * 100).toFixed(1)}%`,
      sorter: (a, b) => a.quality - b.quality,
    },
    {
      title: 'OEE',
      dataIndex: 'oee',
      width: 130,
      sorter: (a, b) => a.oee - b.oee,
      defaultSortOrder: 'descend',
      render: (v: number, r) => (
        <Space>
          <Progress
            percent={+(v * 100).toFixed(1)}
            size="small"
            strokeColor={OEE_COLOR[r.level]}
            style={{ width: 80 }}
            showInfo={false}
          />
          <span style={{ color: OEE_COLOR[r.level], fontWeight: 600 }}>
            {(v * 100).toFixed(1)}%
          </span>
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 90,
      render: (l: DeviceOEE['level'], r) => <Tag color={OEE_COLOR[l]}>{r.levelText}</Tag>,
    },
  ]

  const trendOption = useMemo(() => {
    if (!kpi) return {}
    return {
      grid: { top: 40, right: 50, bottom: 40, left: 50 },
      tooltip: { trigger: 'axis' },
      legend: { data: ['故障次数', '维护成本'], top: 0 },
      xAxis: { type: 'category', data: kpi.failureRateTrend.map((m) => m.month) },
      yAxis: [
        { type: 'value', name: '故障次数' },
        { type: 'value', name: '成本(元)' },
      ],
      series: [
        {
          name: '故障次数',
          type: 'bar',
          data: kpi.failureRateTrend.map((m) => m.failures),
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '维护成本',
          type: 'line',
          yAxisIndex: 1,
          data: kpi.failureRateTrend.map((m) => m.cost),
          itemStyle: { color: '#ff4d4f' },
          smooth: true,
        },
      ],
    }
  }, [kpi])

  const paretoOption = useMemo(() => {
    if (!kpi) return {}
    return {
      grid: { top: 30, right: 20, bottom: 30, left: 100 },
      tooltip: { trigger: 'axis' },
      yAxis: { type: 'category', data: kpi.paretoByInstrument.map((p) => `${p.instrumentId}`).reverse() },
      xAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: kpi.paretoByInstrument.map((p) => p.failures).reverse(),
          itemStyle: { color: '#faad14' },
          label: { show: true, position: 'right' },
        },
      ],
    }
  }, [kpi])

  const columns: ColumnsType<MaintenanceRecord> = [
    { title: '记录编号', dataIndex: 'id', width: 100 },
    { title: '设备', dataIndex: 'instrumentId', width: 100 },
    { title: '位置', dataIndex: 'location' },
    { title: '类型', dataIndex: 'typeText', width: 80, render: (t: string) => <Tag>{t}</Tag> },
    { title: '故障描述', dataIndex: 'faultDescription', width: 200 },
    { title: '处理方案', dataIndex: 'resolution', width: 200 },
    { title: '维护时长(h)', dataIndex: 'durationHours', width: 110 },
    { title: '停机时长(h)', dataIndex: 'downtimeHours', width: 110 },
    { title: '成本(元)', dataIndex: 'cost', width: 100 },
    { title: '技师', dataIndex: 'technician', width: 80 },
    { title: '完成时间', dataIndex: 'completedAt', width: 110, render: fmtDate },
  ]

  return (
    <>
      {/* ─── OEE 设备综合效率 ────────────────────────────── */}
      {oee && (
        <Card
          title={
            <Space>
              <span>设备综合效率 (OEE)</span>
              <Tag color={OEE_COLOR[oee.overall.level]}>{oee.overall.levelText}</Tag>
              <Tooltip title="OEE = 可用率 × 性能率 × 良品率，世界级 ≥ 85%。当前为演示数据：可用率基于维护记录推算，性能/良品率为模拟值。">
                <Tag>演示</Tag>
              </Tooltip>
            </Space>
          }
          style={{ marginBottom: 12 }}
          size="small"
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Row gutter={[8, 8]}>
                <Col span={6}>
                  <ReactECharts
                    option={oeeGaugeOption(oee.overall.availability, '可用率', '#1890ff')}
                    style={{ height: 150 }}
                  />
                </Col>
                <Col span={6}>
                  <ReactECharts
                    option={oeeGaugeOption(oee.overall.performance, '性能率', '#722ed1')}
                    style={{ height: 150 }}
                  />
                </Col>
                <Col span={6}>
                  <ReactECharts
                    option={oeeGaugeOption(oee.overall.quality, '良品率', '#13c2c2')}
                    style={{ height: 150 }}
                  />
                </Col>
                <Col span={6}>
                  <ReactECharts
                    option={oeeGaugeOption(oee.overall.oee, 'OEE 综合', OEE_COLOR[oee.overall.level])}
                    style={{ height: 150 }}
                  />
                </Col>
              </Row>
            </Col>
            <Col xs={24} md={12}>
              <ReactECharts option={oeeTrendOption} style={{ height: 240 }} />
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col xs={24} md={10}>
              <Card type="inner" title="六大损失分析" size="small">
                <ReactECharts option={lossesOption} style={{ height: 240 }} />
              </Card>
            </Col>
            <Col xs={24} md={14}>
              <Card type="inner" title="各设备 OEE 排行" size="small">
                <Table
                  rowKey="instrumentId"
                  dataSource={oee.devices}
                  columns={oeeColumns}
                  pagination={false}
                  size="small"
                  scroll={{ y: 220 }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* ─── 维护 KPI ───────────────────────────────────── */}
      <Row gutter={[12, 12]} className={styles.summaryRow}>
        <Col xs={12} md={5}>
          <Card><Statistic title="维护记录数" value={kpi?.totalRecords ?? 0} /></Card>
        </Col>
        <Col xs={12} md={5}>
          <Card><Statistic title="MTBF (天)" value={kpi?.mtbfDays ?? 0} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={12} md={5}>
          <Card><Statistic title="MTTR (小时)" value={kpi?.mttrHours ?? 0} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={12} md={4}>
          <Card><Statistic title="累计停机(h)" value={kpi?.totalDowntimeHours ?? 0} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={12} md={5}>
          <Card>
            <Statistic
              title="累计成本(元)"
              value={kpi?.totalCost ?? 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={24} md={14}>
          <Card title="故障率与成本月度趋势">
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title="高故障设备 Pareto TOP">
            <ReactECharts option={paretoOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 12 }}>
        <div className={styles.filterBar}>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
        </div>
        <Table
          rowKey="id"
          dataSource={records}
          columns={columns}
          pagination={{ pageSize: 10 }}
          size="middle"
          scroll={{ x: 1300 }}
        />
      </Card>
    </>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────

const PredictiveMaintenance: React.FC = () => {
  return (
    <div className={styles.predictiveMaintenance}>
      <Card
        title={
          <Space>
            <ToolOutlined />
            <span>预测性维护管理</span>
            <Tooltip title="设备健康度评分 / 剩余寿命预测 / 维护工单 / 维护计划 / 维护台账与 KPI">
              <Tag color="blue">演示版</Tag>
            </Tooltip>
          </Space>
        }
        styles={{ body: { padding: 12 } }}
      >
        <Tabs
          defaultActiveKey="health"
          type="card"
          items={[
            {
              key: 'health',
              label: <Space><HeartOutlined />设备健康度</Space>,
              children: <HealthTab />,
            },
            {
              key: 'rul',
              label: <Space><HourglassOutlined />剩余寿命预测</Space>,
              children: <RULTab />,
            },
            {
              key: 'work-orders',
              label: <Space><FileTextOutlined />维护工单</Space>,
              children: <WorkOrderTab />,
            },
            {
              key: 'plans',
              label: <Space><CalendarOutlined />维护计划</Space>,
              children: <PlanTab />,
            },
            {
              key: 'history',
              label: <Space><BarChartOutlined />维护台账 & KPI</Space>,
              children: <HistoryTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default PredictiveMaintenance
