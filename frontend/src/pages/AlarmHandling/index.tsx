import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  message,
  Drawer,
  Descriptions,
  Popconfirm,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  AlertOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import request from '@/utils/request'
import styles from './index.module.scss'

const { RangePicker } = DatePicker

interface HandlingRecord {
  id: string
  alarmId: string
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  deviceId: string
  channelId: string
  alarmType: string
  severity: string
  triggerValue: number
  threshold: number
  alarmMessage: string
  alarmTime: string
  handlingType: 'acknowledged' | 'resolved'
  handledBy: string
  handledAt: string
  note: string
}

interface HandlingStats {
  total: number
  acknowledged: number
  resolved: number
  todayCount: number
}

const alarmTypeTextMap: Record<string, string> = {
  lowLow: '低低报警(LL)',
  low: '低报警(L)',
  high: '高报警(H)',
  highHigh: '高高报警(HH)',
}

const AlarmHandling: React.FC = () => {
  const [records, setRecords] = useState<HandlingRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HandlingRecord | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const [stats, setStats] = useState<HandlingStats>({
    total: 0, acknowledged: 0, resolved: 0, todayCount: 0,
  })

  const [filters, setFilters] = useState({
    handlingType: '',
    severity: '',
    keyword: '',
    dateRange: null as any,
  })

  const loadStats = useCallback(async () => {
    try {
      const res = await request.get('/api/v1/alarm-handling/statistics')
      const data = res?.data?.data || res?.data
      if (data) setStats(data)
    } catch { /* ignore */ }
  }, [])

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
      }
      if (filters.handlingType) params.handlingType = filters.handlingType
      if (filters.severity) params.severity = filters.severity
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.dateRange) {
        params.startTime = filters.dateRange[0].toISOString()
        params.endTime = filters.dateRange[1].toISOString()
      }

      const res = await request.get('/api/v1/alarm-handling', { params })
      const body = res?.data
      const data = body?.data || {}
      setRecords(Array.isArray(data.items) ? data.items : [])
      setTotal(data.total || 0)
    } catch {
      message.error('获取处置记录失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  useEffect(() => {
    loadRecords()
    loadStats()
  }, [loadRecords, loadStats])

  const handleDelete = async (id: string) => {
    try {
      const res = await request.delete(`/api/v1/alarm-handling/${id}`)
      if (res?.data?.code === 0) {
        message.success('删除成功')
        loadRecords()
        loadStats()
      } else {
        message.error('删除失败')
      }
    } catch {
      message.error('删除失败')
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: '#ff4d4f', high: '#fa8c16', medium: '#faad14', low: '#1890ff',
    }
    return colors[severity] || '#d9d9d9'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <CloseCircleOutlined />
      case 'high': return <ExclamationCircleOutlined />
      case 'medium': return <WarningOutlined />
      case 'low': return <AlertOutlined />
      default: return <AlertOutlined />
    }
  }

  const getSeverityText = (severity: string) => {
    const texts: Record<string, string> = {
      critical: '严重', high: '高', medium: '中', low: '低',
    }
    return texts[severity] || severity
  }

  const columns: ColumnsType<HandlingRecord> = [
    {
      title: '处置时间',
      dataIndex: 'handledAt',
      key: 'handledAt',
      width: 175,
      fixed: 'left',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '处置类型',
      dataIndex: 'handlingType',
      key: 'handlingType',
      width: 100,
      render: (type: string) => (
        type === 'resolved'
          ? <Tag icon={<CheckCircleOutlined />} color="success">已解决</Tag>
          : <Tag icon={<ExclamationCircleOutlined />} color="warning">已确认</Tag>
      ),
    },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (severity: string) => (
        <Tag icon={getSeverityIcon(severity)} color={getSeverityColor(severity)}>
          {getSeverityText(severity)}
        </Tag>
      ),
    },
    {
      title: '仪表编号',
      dataIndex: 'instrumentId',
      key: 'instrumentId',
      width: 110,
    },
    {
      title: '安装位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      ellipsis: true,
    },
    {
      title: '监测类型',
      dataIndex: 'monitorType',
      key: 'monitorType',
      width: 125,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '液位': 'blue', '温度': 'volcano', '压力': 'purple',
          '流量': 'cyan', '可燃气体': 'orange',
        }
        const color = Object.entries(colorMap).find(([k]) => type.includes(k))?.[1] || 'default'
        return <Tag color={color}>{type}</Tag>
      },
    },
    {
      title: '报警类型',
      dataIndex: 'alarmType',
      key: 'alarmType',
      width: 130,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          lowLow: 'red', low: 'gold', high: 'orange', highHigh: 'red',
        }
        return <Tag color={colorMap[type] || 'default'}>{alarmTypeTextMap[type] || type}</Tag>
      },
    },
    {
      title: '触发值 / 阈值',
      key: 'valueThreshold',
      width: 150,
      render: (_: unknown, record: HandlingRecord) => (
        <span>
          <span style={{ color: getSeverityColor(record.severity), fontWeight: 600 }}>
            {record.triggerValue}
          </span>
          <span style={{ color: '#999' }}> / {record.threshold} {record.unit}</span>
        </span>
      ),
    },
    {
      title: '处置人',
      dataIndex: 'handledBy',
      key: 'handledBy',
      width: 90,
    },
    {
      title: '处置说明',
      dataIndex: 'note',
      key: 'note',
      width: 180,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      fixed: 'right',
      render: (_: unknown, record: HandlingRecord) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedRecord(record)
              setDetailVisible(true)
            }}
          >
            详情
          </Button>
          <Popconfirm
            title="确认删除此处置记录？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.alarmHandling}>
      {/* 统计卡片 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="处置总数"
              value={stats.total}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已确认"
              value={stats.acknowledged}
              valueStyle={{ color: '#faad14' }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已解决"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<SolutionOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日处置"
              value={stats.todayCount}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Card className={styles.tableCard}>
        {/* 筛选栏 */}
        <div className={styles.filterBar}>
          <Space size="middle" wrap>
            <Select
              style={{ width: 130 }}
              placeholder="处置类型"
              value={filters.handlingType || undefined}
              onChange={value => { setFilters(prev => ({ ...prev, handlingType: value || '' })); setPage(1) }}
              allowClear
            >
              <Select.Option value="acknowledged">已确认</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
            </Select>

            <Select
              style={{ width: 130 }}
              placeholder="严重程度"
              value={filters.severity || undefined}
              onChange={value => { setFilters(prev => ({ ...prev, severity: value || '' })); setPage(1) }}
              allowClear
            >
              <Select.Option value="critical">严重</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>

            <RangePicker
              value={filters.dateRange}
              onChange={value => { setFilters(prev => ({ ...prev, dateRange: value })); setPage(1) }}
            />

            <Input
              style={{ width: 260 }}
              placeholder="搜索仪表编号/位置/设备号/处置人"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={e => { setFilters(prev => ({ ...prev, keyword: e.target.value })); setPage(1) }}
              allowClear
            />

            <Button icon={<ReloadOutlined />} onClick={() => { loadRecords(); loadStats() }}>
              刷新
            </Button>
          </Space>
        </div>

        <Table<HandlingRecord>
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="处置记录详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="记录ID" span={2}>
              {selectedRecord.id}
            </Descriptions.Item>
            <Descriptions.Item label="处置类型">
              {selectedRecord.handlingType === 'resolved'
                ? <Tag icon={<CheckCircleOutlined />} color="success">已解决</Tag>
                : <Tag icon={<ExclamationCircleOutlined />} color="warning">已确认</Tag>
              }
            </Descriptions.Item>
            <Descriptions.Item label="处置人">
              {selectedRecord.handledBy}
            </Descriptions.Item>
            <Descriptions.Item label="处置时间" span={2}>
              {dayjs(selectedRecord.handledAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="处置说明" span={2}>
              {selectedRecord.note}
            </Descriptions.Item>

            <Descriptions.Item label="告警级别">
              <Tag icon={getSeverityIcon(selectedRecord.severity)} color={getSeverityColor(selectedRecord.severity)}>
                {getSeverityText(selectedRecord.severity)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="报警类型">
              <Tag color={['lowLow', 'highHigh'].includes(selectedRecord.alarmType) ? 'red' : 'orange'}>
                {alarmTypeTextMap[selectedRecord.alarmType]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="仪表编号">
              {selectedRecord.instrumentId}
            </Descriptions.Item>
            <Descriptions.Item label="安装位置">
              {selectedRecord.location}
            </Descriptions.Item>
            <Descriptions.Item label="监测类型">
              {selectedRecord.monitorType}
            </Descriptions.Item>
            <Descriptions.Item label="设备号">
              {selectedRecord.deviceId}
            </Descriptions.Item>
            <Descriptions.Item label="触发值">
              <span style={{ color: getSeverityColor(selectedRecord.severity), fontWeight: 600 }}>
                {selectedRecord.triggerValue} {selectedRecord.unit}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="阈值">
              {selectedRecord.threshold} {selectedRecord.unit}
            </Descriptions.Item>
            <Descriptions.Item label="告警信息" span={2}>
              {selectedRecord.alarmMessage}
            </Descriptions.Item>
            <Descriptions.Item label="告警触发时间" span={2}>
              {dayjs(selectedRecord.alarmTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="原始告警ID" span={2}>
              <span style={{ color: '#999', fontSize: 12 }}>{selectedRecord.alarmId}</span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default AlarmHandling
