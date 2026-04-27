import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Badge,
  DatePicker,
  Select,
  Input,
  Modal,
  Form,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Drawer,
  Descriptions,
  Timeline,
  Popconfirm,
} from 'antd'
import {
  AlertOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  SearchOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import styles from './index.module.scss'
import dayjs from 'dayjs'
import AlarmConfig from './AlarmConfig'
import request from '@/utils/request'

const { RangePicker } = DatePicker
const { TextArea } = Input

interface Alarm {
  id: string
  instrumentId: string
  location: string
  monitorType: string
  unit: string
  deviceId: string
  channelId: string
  alarmType: 'lowLow' | 'low' | 'high' | 'highHigh'
  severity: 'critical' | 'high' | 'medium' | 'low'
  value: number
  threshold: number
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  resolvedBy?: string
  note?: string
}

interface AlarmStats {
  total: number
  active: number
  acknowledged: number
  resolved: number
  critical: number
  high: number
  medium: number
  low: number
}

const alarmTypeTextMap: Record<string, string> = {
  lowLow: '低低报警(LL)',
  low: '低报警(L)',
  high: '高报警(H)',
  highHigh: '高高报警(HH)',
}

const AlarmManagement: React.FC = () => {
  const navigate = useNavigate()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [acknowledgeVisible, setAcknowledgeVisible] = useState(false)
  const [configVisible, setConfigVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [form] = Form.useForm()

  // 过滤条件
  const [filters, setFilters] = useState({
    severity: 'all',
    keyword: '',
    dateRange: null as any,
  })

  // 统计数据
  const [stats, setStats] = useState<AlarmStats>({
    total: 0, active: 0, acknowledged: 0, resolved: 0,
    critical: 0, high: 0, medium: 0, low: 0,
  })

  const loadStats = useCallback(async () => {
    try {
      const res = await request.get('/api/v1/alarms/statistics')
      const data = res?.data?.data || res?.data
      if (data) setStats(data)
    } catch {
      // ignore
    }
  }, [])

  const loadAlarms = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (activeTab !== 'all') params.status = activeTab
      if (filters.severity !== 'all') params.severity = filters.severity
      if (filters.keyword) params.keyword = filters.keyword

      const res = await request.get('/api/v1/alarms', { params })
      const body = res?.data
      const list = body?.data?.items || body?.data || []
      setAlarms(Array.isArray(list) ? list : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [activeTab, filters.severity, filters.keyword])

  useEffect(() => {
    loadAlarms()
    loadStats()
  }, [loadAlarms, loadStats])

  // 自动刷新 30s
  useEffect(() => {
    const timer = setInterval(() => {
      loadAlarms()
      loadStats()
    }, 30000)
    return () => clearInterval(timer)
  }, [loadAlarms, loadStats])

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: '#ff4d4f',
      high: '#fa8c16',
      medium: '#faad14',
      low: '#1890ff',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge status="error" text="活动" />
      case 'acknowledged': return <Badge status="warning" text="已确认" />
      case 'resolved': return <Badge status="success" text="已解决" />
      default: return <Badge status="default" text={status} />
    }
  }

  const handleAcknowledge = (alarm: Alarm) => {
    setSelectedAlarm(alarm)
    setAcknowledgeVisible(true)
  }

  const handleResolve = (alarm: Alarm) => {
    Modal.confirm({
      title: '确认解决告警',
      content: `确定要将告警 "${alarm.instrumentId} ${alarmTypeTextMap[alarm.alarmType]}" 标记为已解决吗？`,
      onOk: async () => {
        try {
          await request.put(`/api/v1/alarms/${alarm.id}/resolve`)
          message.success('告警已解决')
          loadAlarms()
          loadStats()
        } catch {
          message.error('操作失败')
        }
      },
    })
  }

  const submitAcknowledge = async () => {
    try {
      const values = await form.validateFields()
      if (selectedAlarm) {
        await request.put(`/api/v1/alarms/${selectedAlarm.id}/acknowledge`, { note: values.note })
        message.success('告警已确认')
        setAcknowledgeVisible(false)
        form.resetFields()
        loadAlarms()
        loadStats()
      }
    } catch (err: any) {
      if (err?.response) message.error('操作失败')
    }
  }

  // 按时间范围本地过滤
  const displayAlarms = filters.dateRange
    ? alarms.filter(a => {
        const t = new Date(a.createdAt).getTime()
        return t >= filters.dateRange[0].valueOf() && t <= filters.dateRange[1].valueOf()
      })
    : alarms

  const columns: ColumnsType<Alarm> = [
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      fixed: 'left',
      render: (severity: string) => (
        <Tag icon={getSeverityIcon(severity)} color={getSeverityColor(severity)}>
          {getSeverityText(severity)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusBadge(status),
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
      width: 160,
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
      width: 160,
      render: (_: unknown, record: Alarm) => (
        <span>
          <span style={{ color: getSeverityColor(record.severity), fontWeight: 600 }}>
            {record.value}
          </span>
          <span style={{ color: '#999' }}> / {record.threshold} {record.unit}</span>
        </span>
      ),
    },
    {
      title: '设备号',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 110,
    },
    {
      title: '触发时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 175,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: Alarm) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedAlarm(record)
              setDetailVisible(true)
            }}
          >
            详情
          </Button>
          {record.status === 'active' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleAcknowledge(record)}
              >
                确认
              </Button>
              <Popconfirm
                title="确定要直接解决此告警吗？"
                onConfirm={() => handleResolve(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" danger icon={<CloseCircleOutlined />}>
                  解决
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'acknowledged' && (
            <Button
              type="primary"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleResolve(record)}
            >
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'active',
      label: (
        <Badge count={stats.active} offset={[10, 0]}>
          <span>活动告警</span>
        </Badge>
      ),
    },
    {
      key: 'acknowledged',
      label: (
        <Badge count={stats.acknowledged} offset={[10, 0]} style={{ backgroundColor: '#faad14' }}>
          <span>已确认</span>
        </Badge>
      ),
    },
    {
      key: 'resolved',
      label: (
        <Badge count={stats.resolved} offset={[10, 0]} style={{ backgroundColor: '#52c41a' }}>
          <span>已解决</span>
        </Badge>
      ),
    },
    { key: 'all', label: '全部告警' },
  ]

  return (
    <div className={styles.alarmManagement}>
      {/* 统计卡片 */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总告警数"
              value={stats.total}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活动告警"
              value={stats.active}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ cursor: 'pointer' }} onClick={() => navigate('/alarm-handling')}>
            <Statistic
              title="已确认"
              value={stats.acknowledged}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ cursor: 'pointer' }} onClick={() => navigate('/alarm-handling')}>
            <Statistic
              title="已解决"
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容区 */}
      <Card className={styles.mainCard}>
        {/* 筛选栏 */}
        <div className={styles.filterBar}>
          <Space size="middle" wrap>
            <Select
              style={{ width: 130 }}
              placeholder="严重程度"
              value={filters.severity}
              onChange={value => setFilters(prev => ({ ...prev, severity: value }))}
            >
              <Select.Option value="all">全部级别</Select.Option>
              <Select.Option value="critical">严重</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>

            <RangePicker
              value={filters.dateRange}
              onChange={value => setFilters(prev => ({ ...prev, dateRange: value }))}
            />

            <Input
              style={{ width: 260 }}
              placeholder="搜索仪表编号/位置/设备号/监测类型"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              allowClear
            />

            <Button icon={<ReloadOutlined />} onClick={() => { loadAlarms(); loadStats() }}>
              刷新
            </Button>

            <Button icon={<SettingOutlined />} onClick={() => setConfigVisible(true)}>
              阈值总览
            </Button>
          </Space>
        </div>

        {/* 标签页 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {/* 告警表格 */}
        <Table<Alarm>
          columns={columns}
          dataSource={displayAlarms}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowClassName={(record) => {
            if (record.status === 'active' && record.severity === 'critical') {
              return styles.criticalRow
            }
            if (record.status === 'active' && record.severity === 'high') {
              return styles.warningRow
            }
            return ''
          }}
        />
      </Card>

      {/* 告警详情抽屉 */}
      <Drawer
        title="告警详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedAlarm && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="告警ID" span={2}>
                {selectedAlarm.id}
              </Descriptions.Item>
              <Descriptions.Item label="仪表编号">
                {selectedAlarm.instrumentId}
              </Descriptions.Item>
              <Descriptions.Item label="安装位置">
                {selectedAlarm.location}
              </Descriptions.Item>
              <Descriptions.Item label="监测类型">
                {selectedAlarm.monitorType}
              </Descriptions.Item>
              <Descriptions.Item label="设备号">
                {selectedAlarm.deviceId}
              </Descriptions.Item>
              <Descriptions.Item label="通道号">
                {selectedAlarm.channelId}
              </Descriptions.Item>
              <Descriptions.Item label="报警类型">
                <Tag color={['lowLow', 'highHigh'].includes(selectedAlarm.alarmType) ? 'red' : 'orange'}>
                  {alarmTypeTextMap[selectedAlarm.alarmType]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度" span={2}>
                <Tag
                  icon={getSeverityIcon(selectedAlarm.severity)}
                  color={getSeverityColor(selectedAlarm.severity)}
                >
                  {getSeverityText(selectedAlarm.severity)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态" span={2}>
                {getStatusBadge(selectedAlarm.status)}
              </Descriptions.Item>
              <Descriptions.Item label="触发值">
                <span style={{ color: getSeverityColor(selectedAlarm.severity), fontWeight: 600 }}>
                  {selectedAlarm.value} {selectedAlarm.unit}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="阈值">
                {selectedAlarm.threshold} {selectedAlarm.unit}
              </Descriptions.Item>
              <Descriptions.Item label="告警信息" span={2}>
                {selectedAlarm.message}
              </Descriptions.Item>
              <Descriptions.Item label="触发时间" span={2}>
                {dayjs(selectedAlarm.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {selectedAlarm.acknowledgedBy && (
                <>
                  <Descriptions.Item label="确认人">
                    {selectedAlarm.acknowledgedBy}
                  </Descriptions.Item>
                  <Descriptions.Item label="确认时间">
                    {dayjs(selectedAlarm.acknowledgedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </>
              )}
              {selectedAlarm.resolvedBy && (
                <>
                  <Descriptions.Item label="解决人">
                    {selectedAlarm.resolvedBy}
                  </Descriptions.Item>
                  <Descriptions.Item label="解决时间">
                    {dayjs(selectedAlarm.resolvedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedAlarm.note && (
              <Card title="处理记录" style={{ marginTop: 16 }}>
                <Timeline
                  items={[{ children: selectedAlarm.note }]}
                />
              </Card>
            )}
          </>
        )}
      </Drawer>

      {/* 确认告警弹窗 */}
      <Modal
        title="确认告警"
        open={acknowledgeVisible}
        onOk={submitAcknowledge}
        onCancel={() => {
          setAcknowledgeVisible(false)
          form.resetFields()
        }}
        confirmLoading={loading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="告警信息">
            <Input.TextArea
              value={selectedAlarm?.message}
              disabled
              rows={2}
            />
          </Form.Item>
          <Form.Item
            name="note"
            label="处理说明"
            rules={[{ required: true, message: '请输入处理说明' }]}
          >
            <TextArea
              rows={4}
              placeholder="请描述您的处理措施..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 阈值总览 */}
      <AlarmConfig
        visible={configVisible}
        onClose={() => setConfigVisible(false)}
      />
    </div>
  )
}

export default AlarmManagement
