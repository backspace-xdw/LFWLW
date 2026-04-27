import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  Badge,
  message,
  Modal,
  Descriptions,
  Progress,
  Segmented,
  Tooltip,
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ReactECharts from 'echarts-for-react'
import request from '@/utils/request'
import styles from './index.module.scss'

interface InstrumentThreshold {
  lowLow: number | null
  low: number | null
  high: number | null
  highHigh: number | null
}

interface Instrument {
  id: string
  location: string
  monitorType: string
  unit: string
  threshold: InstrumentThreshold
  rangeMin: number
  rangeMax: number
  longitude: number | null
  latitude: number | null
  deviceId: string
  channelId: string
  collectTime: string
  value: number | null
  deviceStatus: 'normal' | 'fault' | 'offline'
  alarmStatus: 'none' | 'lowLow' | 'low' | 'high' | 'highHigh'
}

interface Stats {
  total: number
  normal: number
  alarming: number
  fault: number
  offline: number
}

const alarmStatusMap: Record<string, { text: string; color: string }> = {
  none: { text: '正常', color: 'green' },
  low: { text: '低一报警', color: 'orange' },
  lowLow: { text: '低二报警', color: 'red' },
  high: { text: '高一报警', color: 'orange' },
  highHigh: { text: '高二报警', color: 'red' },
}

const deviceStatusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  normal: { text: '正常', color: 'green', icon: <CheckCircleOutlined /> },
  fault: { text: '故障', color: 'red', icon: <CloseCircleOutlined /> },
  offline: { text: '离线', color: 'default', icon: <ExclamationCircleOutlined /> },
}

const monitorTypeColorMap: Record<string, string> = {
  '液位': 'blue',
  '温度': 'volcano',
  '压力': 'green',
  '流量': 'cyan',
  '可燃气体': 'orange',
  '有毒气体(H2S)': 'magenta',
  '有毒气体(NH3)': 'purple',
}

// 生成迷你趋势数据（基于当前值模拟最近20个点）
function generateSparkline(inst: Instrument): number[] {
  if (inst.value === null) return []
  const points: number[] = []
  const range = inst.rangeMax - inst.rangeMin
  const seed = inst.id.charCodeAt(3) + inst.id.charCodeAt(4)
  for (let i = 0; i < 20; i++) {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280
    const noise = (x - Math.floor(x) - 0.5) * range * 0.08
    const wave = Math.sin((i + seed) * 0.5) * range * 0.05
    let v = inst.value + noise + wave
    v = Math.max(inst.rangeMin, Math.min(inst.rangeMax, v))
    points.push(Math.round(v * 100) / 100)
  }
  points.push(inst.value)
  return points
}

// 值在量程中的百分比位置
function valuePercent(value: number | null, min: number, max: number): number {
  if (value === null) return 0
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

// 进度条颜色
function getValueColor(inst: Instrument): string {
  if (inst.alarmStatus === 'highHigh' || inst.alarmStatus === 'lowLow') return '#ff4d4f'
  if (inst.alarmStatus === 'high' || inst.alarmStatus === 'low') return '#fa8c16'
  if (inst.deviceStatus === 'offline') return '#d9d9d9'
  if (inst.deviceStatus === 'fault') return '#fadb14'
  return '#52c41a'
}

// 迷你趋势图配置
function sparklineOption(data: number[], color: string, min: number, max: number): any {
  return {
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { show: false, type: 'category', data: data.map((_, i) => i) },
    yAxis: { show: false, type: 'value', min, max },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '33' }, { offset: 1, color: color + '05' }] } },
    }],
    tooltip: { show: false },
  }
}

const OnlineMonitoring: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, normal: 0, alarming: 0, fault: 0, offline: 0 })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [monitorTypeFilter, setMonitorTypeFilter] = useState<string | undefined>(undefined)
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<string | undefined>(undefined)
  const [alarmStatusFilter, setAlarmStatusFilter] = useState<string | undefined>(undefined)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (keyword) params.keyword = keyword
      if (monitorTypeFilter) params.monitorType = monitorTypeFilter
      if (deviceStatusFilter) params.deviceStatus = deviceStatusFilter
      if (alarmStatusFilter) params.alarmStatus = alarmStatusFilter

      const [instRes, statsRes] = await Promise.all([
        request.get('/api/v1/instruments', { params }),
        request.get('/api/v1/instruments/stats'),
      ])

      const instData = instRes?.data?.data || instRes?.data || []
      const statsData = statsRes?.data?.data || statsRes?.data || {}

      setInstruments(Array.isArray(instData) ? instData : [])
      setStats(statsData)
    } catch {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, monitorTypeFilter, deviceStatusFilter, alarmStatusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(fetchData, 30000)
    return () => clearInterval(timer)
  }, [autoRefresh, fetchData])

  const showDetail = (record: Instrument) => {
    setSelectedInstrument(record)
    setDetailVisible(true)
  }

  const monitorTypes = useMemo(() => [...new Set(instruments.map(i => i.monitorType))], [instruments])

  // ============ 卡片视图 ============
  const renderCardView = () => (
    <Row gutter={[16, 16]}>
      {instruments.map(inst => {
        const pct = valuePercent(inst.value, inst.rangeMin, inst.rangeMax)
        const color = getValueColor(inst)
        const sparkData = generateSparkline(inst)
        const typeColor = Object.entries(monitorTypeColorMap).find(([k]) => inst.monitorType.includes(k))?.[1] || 'default'
        const isOffline = inst.deviceStatus === 'offline'

        return (
          <Col xs={24} sm={12} lg={8} xl={6} key={inst.id}>
            <Card
              size="small"
              hoverable
              onClick={() => showDetail(inst)}
              className={`${styles.instrumentCard} ${inst.alarmStatus !== 'none' ? styles.cardAlarming : ''} ${isOffline ? styles.cardOffline : ''}`}
            >
              {/* 头部：编号 + 类型标签 + 状态 */}
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.cardId}>{inst.id}</span>
                  <Tag color={typeColor} style={{ marginLeft: 6 }}>{inst.monitorType}</Tag>
                </div>
                <div>
                  {inst.alarmStatus !== 'none' ? (
                    <Tag color={alarmStatusMap[inst.alarmStatus]?.color === 'red' ? 'error' : 'warning'}>
                      {alarmStatusMap[inst.alarmStatus]?.text}
                    </Tag>
                  ) : (
                    <Tag icon={deviceStatusMap[inst.deviceStatus]?.icon} color={deviceStatusMap[inst.deviceStatus]?.color}>
                      {deviceStatusMap[inst.deviceStatus]?.text}
                    </Tag>
                  )}
                </div>
              </div>

              {/* 位置 */}
              <div className={styles.cardLocation}>{inst.location}</div>

              {/* 当前值 + 进度条 */}
              <div className={styles.cardValue}>
                <span style={{ color: isOffline ? '#bbb' : color, fontSize: 28, fontWeight: 700 }}>
                  {inst.value !== null ? inst.value : '--'}
                </span>
                <span className={styles.cardUnit}>{inst.unit}</span>
              </div>

              <Tooltip title={`${inst.rangeMin} ~ ${inst.rangeMax} ${inst.unit}`}>
                <Progress
                  percent={pct}
                  strokeColor={color}
                  trailColor="#f0f0f0"
                  showInfo={false}
                  size="small"
                  style={{ marginBottom: 4 }}
                />
              </Tooltip>
              <div className={styles.cardRange}>
                <span>{inst.rangeMin}</span>
                <span>{inst.rangeMax} {inst.unit}</span>
              </div>

              {/* 迷你趋势 */}
              {sparkData.length > 0 && (
                <div className={styles.cardSparkline}>
                  <ReactECharts
                    option={sparklineOption(sparkData, color, inst.rangeMin, inst.rangeMax)}
                    style={{ height: 45, width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              )}

              {/* 阈值标签 */}
              <div className={styles.cardThresholds}>
                {inst.threshold.lowLow !== null && <Tag color="red" className={styles.thTag}>LL:{inst.threshold.lowLow}</Tag>}
                {inst.threshold.low !== null && <Tag color="orange" className={styles.thTag}>L:{inst.threshold.low}</Tag>}
                {inst.threshold.high !== null && <Tag color="orange" className={styles.thTag}>H:{inst.threshold.high}</Tag>}
                {inst.threshold.highHigh !== null && <Tag color="red" className={styles.thTag}>HH:{inst.threshold.highHigh}</Tag>}
              </div>
            </Card>
          </Col>
        )
      })}
    </Row>
  )

  // ============ 列表视图 ============
  const columns: ColumnsType<Instrument> = [
    {
      title: '仪表编号', dataIndex: 'id', key: 'id', width: 100, fixed: 'left',
      render: (id: string) => <a onClick={() => showDetail(instruments.find(i => i.id === id)!)}>{id}</a>,
    },
    { title: '安装位置', dataIndex: 'location', key: 'location', width: 140, ellipsis: true },
    {
      title: '监测类型', dataIndex: 'monitorType', key: 'monitorType', width: 125,
      render: (type: string) => {
        const color = Object.entries(monitorTypeColorMap).find(([k]) => type.includes(k))?.[1] || 'default'
        return <Tag color={color}>{type}</Tag>
      },
    },
    {
      title: '当前值', key: 'value', width: 200,
      render: (_: unknown, record: Instrument) => {
        if (record.value === null) return <span style={{ color: '#999' }}>--</span>
        const pct = valuePercent(record.value, record.rangeMin, record.rangeMax)
        const color = getValueColor(record)
        return (
          <div style={{ minWidth: 150 }}>
            <div style={{ fontWeight: 600, color, fontSize: 15, marginBottom: 2 }}>
              {record.value} <span style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>{record.unit}</span>
            </div>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
          </div>
        )
      },
    },
    {
      title: '趋势', key: 'trend', width: 120,
      render: (_: unknown, record: Instrument) => {
        const data = generateSparkline(record)
        if (data.length === 0) return '--'
        const color = getValueColor(record)
        return (
          <ReactECharts
            option={sparklineOption(data, color, record.rangeMin, record.rangeMax)}
            style={{ height: 35, width: 100 }}
            opts={{ renderer: 'svg' }}
          />
        )
      },
    },
    {
      title: '量程', key: 'range', width: 110,
      render: (_: unknown, record: Instrument) => (
        <span style={{ color: '#666', fontSize: 13 }}>{record.rangeMin}~{record.rangeMax} {record.unit}</span>
      ),
    },
    {
      title: '阈值', key: 'threshold', width: 180,
      render: (_: unknown, record: Instrument) => {
        const t = record.threshold
        return (
          <Space size={3} wrap>
            {t.lowLow !== null && <Tag color="red">LL:{t.lowLow}</Tag>}
            {t.low !== null && <Tag color="orange">L:{t.low}</Tag>}
            {t.high !== null && <Tag color="orange">H:{t.high}</Tag>}
            {t.highHigh !== null && <Tag color="red">HH:{t.highHigh}</Tag>}
          </Space>
        )
      },
    },
    {
      title: '报警状态', dataIndex: 'alarmStatus', key: 'alarmStatus', width: 100, fixed: 'right',
      render: (status: string) => {
        const info = alarmStatusMap[status] || alarmStatusMap.none
        return status === 'none'
          ? <Badge status="success" text={info.text} />
          : <Badge status="error" text={<span style={{ color: info.color === 'red' ? '#ff4d4f' : '#fa8c16' }}>{info.text}</span>} />
      },
    },
  ]

  return (
    <div className={styles.onlineMonitoring}>
      {/* 统计卡片 — 科技风 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={12} sm={8} lg={4}>
          <div className={`${styles.statCard} ${styles.statCardBlue}`}>
            <DashboardOutlined className={styles.statBgIcon} />
            <div className={styles.statBody}>
              <div className={styles.statLabel}>仪表总数</div>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statUnit}>TOTAL</div>
            </div>
            <span className={styles.statCornerTL} />
            <span className={styles.statCornerBR} />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <CheckCircleOutlined className={styles.statBgIcon} />
            <div className={styles.statBody}>
              <div className={styles.statLabel}>正常运行</div>
              <div className={styles.statValue}>{stats.normal}</div>
              <div className={styles.statUnit}>NORMAL</div>
            </div>
            <span className={styles.statCornerTL} />
            <span className={styles.statCornerBR} />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className={`${styles.statCard} ${styles.statCardRed} ${stats.alarming > 0 ? styles.statCardPulse : ''}`}>
            <WarningOutlined className={styles.statBgIcon} />
            <div className={styles.statBody}>
              <div className={styles.statLabel}>报警中</div>
              <div className={styles.statValue}>{stats.alarming}</div>
              <div className={styles.statUnit}>ALARM</div>
            </div>
            <span className={styles.statCornerTL} />
            <span className={styles.statCornerBR} />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className={`${styles.statCard} ${styles.statCardOrange} ${stats.fault > 0 ? styles.statCardPulse : ''}`}>
            <CloseCircleOutlined className={styles.statBgIcon} />
            <div className={styles.statBody}>
              <div className={styles.statLabel}>设备故障</div>
              <div className={styles.statValue}>{stats.fault}</div>
              <div className={styles.statUnit}>FAULT</div>
            </div>
            <span className={styles.statCornerTL} />
            <span className={styles.statCornerBR} />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className={`${styles.statCard} ${styles.statCardGray}`}>
            <ExclamationCircleOutlined className={styles.statBgIcon} />
            <div className={styles.statBody}>
              <div className={styles.statLabel}>离线</div>
              <div className={styles.statValue}>{stats.offline}</div>
              <div className={styles.statUnit}>OFFLINE</div>
            </div>
            <span className={styles.statCornerTL} />
            <span className={styles.statCornerBR} />
          </div>
        </Col>
      </Row>

      {/* 筛选 + 视图切换 */}
      <Card className={styles.filterCard}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Input placeholder="搜索仪表编号/位置/设备号" prefix={<SearchOutlined />} value={keyword} onChange={e => setKeyword(e.target.value)} allowClear />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="监测类型" value={monitorTypeFilter} onChange={setMonitorTypeFilter} allowClear style={{ width: '100%' }}>
              {monitorTypes.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="设备状态" value={deviceStatusFilter} onChange={setDeviceStatusFilter} allowClear style={{ width: '100%' }}>
              <Select.Option value="normal">正常</Select.Option>
              <Select.Option value="fault">故障</Select.Option>
              <Select.Option value="offline">离线</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="报警状态" value={alarmStatusFilter} onChange={setAlarmStatusFilter} allowClear style={{ width: '100%' }}>
              <Select.Option value="none">正常</Select.Option>
              <Select.Option value="alarming">报警中</Select.Option>
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Segmented
                options={[
                  { label: <><AppstoreOutlined /> 卡片</>, value: 'card' },
                  { label: <><UnorderedListOutlined /> 列表</>, value: 'table' },
                ]}
                value={viewMode}
                onChange={v => setViewMode(v as 'card' | 'table')}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
              <Button type={autoRefresh ? 'primary' : 'default'} onClick={() => setAutoRefresh(!autoRefresh)}>
                {autoRefresh ? '停止刷新' : '自动(30s)'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 内容区 */}
      {viewMode === 'card' ? (
        <div className={styles.cardContainer}>
          {renderCardView()}
        </div>
      ) : (
        <Card className={styles.tableCard}>
          <Table<Instrument>
            columns={columns}
            dataSource={instruments}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={false}
            rowClassName={(record) => {
              if (record.alarmStatus === 'highHigh' || record.alarmStatus === 'lowLow') return styles.rowCritical
              if (record.alarmStatus === 'high' || record.alarmStatus === 'low') return styles.rowWarning
              if (record.deviceStatus === 'offline') return styles.rowOffline
              if (record.deviceStatus === 'fault') return styles.rowFault
              return ''
            }}
          />
        </Card>
      )}

      {/* 详情弹窗 */}
      <Modal
        title={`仪表详情 - ${selectedInstrument?.id || ''}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={750}
      >
        {selectedInstrument && (() => {
          const inst = selectedInstrument
          const pct = valuePercent(inst.value, inst.rangeMin, inst.rangeMax)
          const color = getValueColor(inst)
          const sparkData = generateSparkline(inst)
          return (
            <>
              {/* 核心数据区 */}
              <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={10} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 40, fontWeight: 700, color }}>
                    {inst.value !== null ? inst.value : '--'}
                    <span style={{ fontSize: 16, fontWeight: 400, color: '#666', marginLeft: 4 }}>{inst.unit}</span>
                  </div>
                  <Progress percent={pct} strokeColor={color} showInfo={false} style={{ width: '80%', margin: '8px auto' }} />
                  <div style={{ color: '#999', fontSize: 12 }}>{inst.rangeMin} ~ {inst.rangeMax} {inst.unit}</div>
                </Col>
                <Col span={14}>
                  {sparkData.length > 0 && (
                    <ReactECharts
                      option={{
                        ...sparklineOption(sparkData, color, inst.rangeMin, inst.rangeMax),
                        grid: { left: 40, right: 10, top: 10, bottom: 20 },
                        xAxis: { show: true, type: 'category', data: sparkData.map((_, i) => `${i}`), axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#eee' } } },
                        yAxis: { show: true, type: 'value', min: inst.rangeMin, max: inst.rangeMax, splitLine: { lineStyle: { color: '#f5f5f5' } }, axisLabel: { fontSize: 10 } },
                        tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0]?.value} ${inst.unit}` },
                      }}
                      style={{ height: 120 }}
                    />
                  )}
                </Col>
              </Row>

              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="仪表编号">{inst.id}</Descriptions.Item>
                <Descriptions.Item label="设备号">{inst.deviceId}</Descriptions.Item>
                <Descriptions.Item label="安装位置" span={2}>{inst.location}</Descriptions.Item>
                <Descriptions.Item label="监测类型"><Tag><ExperimentOutlined /> {inst.monitorType}</Tag></Descriptions.Item>
                <Descriptions.Item label="通道号">{inst.channelId}</Descriptions.Item>
                <Descriptions.Item label="低二(LL)">{inst.threshold.lowLow ?? '--'}</Descriptions.Item>
                <Descriptions.Item label="低一(L)">{inst.threshold.low ?? '--'}</Descriptions.Item>
                <Descriptions.Item label="高一(H)">{inst.threshold.high ?? '--'}</Descriptions.Item>
                <Descriptions.Item label="高二(HH)">{inst.threshold.highHigh ?? '--'}</Descriptions.Item>
                <Descriptions.Item label="采集时间">{inst.collectTime ? new Date(inst.collectTime).toLocaleString('zh-CN') : '--'}</Descriptions.Item>
                <Descriptions.Item label="设备状态">
                  <Tag icon={deviceStatusMap[inst.deviceStatus]?.icon} color={deviceStatusMap[inst.deviceStatus]?.color}>{deviceStatusMap[inst.deviceStatus]?.text}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="报警状态">
                  {inst.alarmStatus === 'none'
                    ? <Badge status="success" text="正常" />
                    : <Badge status="error" text={<span style={{ color: '#ff4d4f' }}>{alarmStatusMap[inst.alarmStatus]?.text}</span>} />}
                </Descriptions.Item>
                <Descriptions.Item label="经纬度">
                  {inst.longitude && inst.latitude ? <><EnvironmentOutlined /> {inst.longitude.toFixed(4)}, {inst.latitude.toFixed(4)}</> : '--'}
                </Descriptions.Item>
              </Descriptions>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}

export default OnlineMonitoring
