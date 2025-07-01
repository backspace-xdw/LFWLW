import React, { useState, useEffect } from 'react'
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
  Tooltip,
  Row,
  Col,
  Statistic,
  Tabs,
  Timeline,
  Drawer,
  Descriptions,
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
  FilterOutlined,
  FileTextOutlined,
  HistoryOutlined,
  BugOutlined,
  ToolOutlined,
  SoundOutlined,
  ClockCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useMonitorData } from '@/hooks/useRealtimeData'
import styles from './index.module.scss'
import dayjs from 'dayjs'
import AlarmConfig from './AlarmConfig'

const { RangePicker } = DatePicker
const { TabPane } = Tabs
const { TextArea } = Input

interface Alarm {
  id: string
  deviceId: string
  deviceName: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'active' | 'acknowledged' | 'resolved'
  value: number
  threshold: number
  message: string
  timestamp: number
  acknowledgedBy?: string
  acknowledgedAt?: number
  resolvedBy?: string
  resolvedAt?: number
  notes?: string[]
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

const AlarmManagement: React.FC = () => {
  const { alarms: realtimeAlarms } = useMonitorData()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [filteredAlarms, setFilteredAlarms] = useState<Alarm[]>([])
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
    status: 'all',
    deviceId: 'all',
    dateRange: null as any,
    keyword: '',
  })

  // 统计数据
  const [stats, setStats] = useState<AlarmStats>({
    total: 0,
    active: 0,
    acknowledged: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  })

  // 模拟告警数据
  useEffect(() => {
    loadAlarms()
  }, [])

  // 处理实时告警
  useEffect(() => {
    if (realtimeAlarms.length > 0) {
      const newAlarm = realtimeAlarms[realtimeAlarms.length - 1]
      const formattedAlarm: Alarm = {
        id: `alarm_${Date.now()}`,
        deviceId: newAlarm.deviceId,
        deviceName: getDeviceName(newAlarm.deviceId),
        type: newAlarm.type,
        severity: newAlarm.severity,
        status: 'active',
        value: newAlarm.value,
        threshold: newAlarm.threshold,
        message: newAlarm.message,
        timestamp: newAlarm.timestamp || Date.now(),
      }
      
      setAlarms(prev => [formattedAlarm, ...prev])
      
      // 显示通知
      if (newAlarm.severity === 'critical' || newAlarm.severity === 'high') {
        message.error(`新的${getSeverityText(newAlarm.severity)}告警: ${newAlarm.message}`)
      }
    }
  }, [realtimeAlarms])

  // 更新统计
  useEffect(() => {
    updateStats()
    applyFilters()
  }, [alarms, filters])

  const loadAlarms = () => {
    // 模拟历史告警数据
    const mockAlarms: Alarm[] = [
      {
        id: 'alarm_001',
        deviceId: 'PUMP_001',
        deviceName: '主循环泵',
        type: 'temperature_high',
        severity: 'high',
        status: 'active',
        value: 88,
        threshold: 85,
        message: '设备 PUMP_001 温度过高: 88°C',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'alarm_002',
        deviceId: 'VALVE_002',
        deviceName: '进料阀门',
        type: 'pressure_high',
        severity: 'medium',
        status: 'acknowledged',
        value: 4.8,
        threshold: 4.5,
        message: '设备 VALVE_002 压力过高: 4.8 bar',
        timestamp: Date.now() - 7200000,
        acknowledgedBy: 'operator1',
        acknowledgedAt: Date.now() - 3600000,
        notes: ['已调整阀门开度', '持续监控中'],
      },
      {
        id: 'alarm_003',
        deviceId: 'TANK_005',
        deviceName: '储罐-5号',
        type: 'level_low',
        severity: 'low',
        status: 'resolved',
        value: 18,
        threshold: 20,
        message: '设备 TANK_005 液位过低: 18%',
        timestamp: Date.now() - 14400000,
        acknowledgedBy: 'operator2',
        acknowledgedAt: Date.now() - 10800000,
        resolvedBy: 'engineer1',
        resolvedAt: Date.now() - 7200000,
        notes: ['已补充液体', '液位恢复正常'],
      },
    ]
    
    setAlarms(mockAlarms)
  }

  const getDeviceName = (deviceId: string): string => {
    const deviceNames: Record<string, string> = {
      'PUMP_001': '主循环泵',
      'VALVE_002': '进料阀门',
      'SENSOR_003': '温度传感器',
      'MOTOR_004': '驱动电机',
      'TANK_005': '储罐-5号',
    }
    return deviceNames[deviceId] || deviceId
  }

  const updateStats = () => {
    const newStats: AlarmStats = {
      total: alarms.length,
      active: alarms.filter(a => a.status === 'active').length,
      acknowledged: alarms.filter(a => a.status === 'acknowledged').length,
      resolved: alarms.filter(a => a.status === 'resolved').length,
      critical: alarms.filter(a => a.severity === 'critical').length,
      high: alarms.filter(a => a.severity === 'high').length,
      medium: alarms.filter(a => a.severity === 'medium').length,
      low: alarms.filter(a => a.severity === 'low').length,
    }
    setStats(newStats)
  }

  const applyFilters = () => {
    let filtered = [...alarms]

    // 按严重程度过滤
    if (filters.severity !== 'all') {
      filtered = filtered.filter(a => a.severity === filters.severity)
    }

    // 按状态过滤
    if (filters.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.status)
    }

    // 按设备过滤
    if (filters.deviceId !== 'all') {
      filtered = filtered.filter(a => a.deviceId === filters.deviceId)
    }

    // 按时间范围过滤
    if (filters.dateRange) {
      const [start, end] = filters.dateRange
      filtered = filtered.filter(a => 
        a.timestamp >= start.valueOf() && a.timestamp <= end.valueOf()
      )
    }

    // 按关键词过滤
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      filtered = filtered.filter(a => 
        a.message.toLowerCase().includes(keyword) ||
        a.deviceName.toLowerCase().includes(keyword) ||
        a.type.toLowerCase().includes(keyword)
      )
    }

    // 按标签页过滤
    if (activeTab === 'active') {
      filtered = filtered.filter(a => a.status === 'active')
    } else if (activeTab === 'acknowledged') {
      filtered = filtered.filter(a => a.status === 'acknowledged')
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter(a => a.status === 'resolved')
    }

    setFilteredAlarms(filtered)
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: '#ff4d4f',
      high: '#fa8c16',
      medium: '#faad14',
      low: '#1890ff',
    }
    return colors[severity as keyof typeof colors] || '#d9d9d9'
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <CloseCircleOutlined />
      case 'high':
        return <ExclamationCircleOutlined />
      case 'medium':
        return <WarningOutlined />
      case 'low':
        return <AlertOutlined />
      default:
        return <AlertOutlined />
    }
  }

  const getSeverityText = (severity: string) => {
    const texts = {
      critical: '严重',
      high: '高',
      medium: '中',
      low: '低',
    }
    return texts[severity as keyof typeof texts] || severity
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge status="error" text="活动" />
      case 'acknowledged':
        return <Badge status="warning" text="已确认" />
      case 'resolved':
        return <Badge status="success" text="已解决" />
      default:
        return <Badge status="default" text={status} />
    }
  }

  const handleAcknowledge = async (alarm: Alarm) => {
    setSelectedAlarm(alarm)
    setAcknowledgeVisible(true)
  }

  const handleResolve = async (alarm: Alarm) => {
    Modal.confirm({
      title: '确认解决告警',
      content: `确定要将告警 "${alarm.message}" 标记为已解决吗？`,
      onOk: async () => {
        try {
          setLoading(true)
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const updatedAlarm = {
            ...alarm,
            status: 'resolved' as const,
            resolvedBy: 'admin',
            resolvedAt: Date.now(),
          }
          
          setAlarms(prev => 
            prev.map(a => a.id === alarm.id ? updatedAlarm : a)
          )
          
          message.success('告警已解决')
        } catch (error) {
          message.error('操作失败')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const submitAcknowledge = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (selectedAlarm) {
        const updatedAlarm = {
          ...selectedAlarm,
          status: 'acknowledged' as const,
          acknowledgedBy: 'admin',
          acknowledgedAt: Date.now(),
          notes: [...(selectedAlarm.notes || []), values.note],
        }
        
        setAlarms(prev => 
          prev.map(a => a.id === selectedAlarm.id ? updatedAlarm : a)
        )
        
        message.success('告警已确认')
        setAcknowledgeVisible(false)
        form.resetFields()
      }
    } catch (error) {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<Alarm> = [
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      fixed: 'left',
      render: (severity: string) => (
        <Tag 
          icon={getSeverityIcon(severity)} 
          color={getSeverityColor(severity)}
        >
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
      title: '设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 120,
      render: (name: string, record) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.deviceId}</div>
        </div>
      ),
    },
    {
      title: '告警信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '数值',
      key: 'value',
      width: 120,
      render: (_, record) => (
        <div>
          <span style={{ color: getSeverityColor(record.severity), fontWeight: 'bold' }}>
            {record.value}
          </span>
          <span style={{ color: '#999' }}> / {record.threshold}</span>
        </div>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: number) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
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
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleAcknowledge(record)}
              >
                确认
              </Button>
              <Popconfirm
                title="确定要直接解决此告警吗？"
                onConfirm={() => handleResolve(record)}
              >
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                >
                  解决
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'acknowledged' && (
            <Button
              size="small"
              type="primary"
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
          <Card>
            <Statistic
              title="已确认"
              value={stats.acknowledged}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
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
              style={{ width: 120 }}
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
            
            <Select
              style={{ width: 120 }}
              placeholder="设备"
              value={filters.deviceId}
              onChange={value => setFilters(prev => ({ ...prev, deviceId: value }))}
            >
              <Select.Option value="all">全部设备</Select.Option>
              <Select.Option value="PUMP_001">主循环泵</Select.Option>
              <Select.Option value="VALVE_002">进料阀门</Select.Option>
              <Select.Option value="SENSOR_003">温度传感器</Select.Option>
              <Select.Option value="MOTOR_004">驱动电机</Select.Option>
              <Select.Option value="TANK_005">储罐-5号</Select.Option>
            </Select>
            
            <RangePicker
              value={filters.dateRange}
              onChange={value => setFilters(prev => ({ ...prev, dateRange: value }))}
            />
            
            <Input
              style={{ width: 200 }}
              placeholder="搜索告警信息"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
            
            <Button
              icon={<ReloadOutlined />}
              onClick={loadAlarms}
            >
              刷新
            </Button>
            
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigVisible(true)}
            >
              规则配置
            </Button>
          </Space>
        </div>

        {/* 标签页 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Space>
                <Badge count={stats.active} offset={[10, 0]}>
                  <span>活动告警</span>
                </Badge>
              </Space>
            } 
            key="active"
          />
          <TabPane 
            tab={
              <Space>
                <Badge count={stats.acknowledged} offset={[10, 0]} style={{ backgroundColor: '#faad14' }}>
                  <span>已确认</span>
                </Badge>
              </Space>
            } 
            key="acknowledged" 
          />
          <TabPane 
            tab={
              <Space>
                <Badge count={stats.resolved} offset={[10, 0]} style={{ backgroundColor: '#52c41a' }}>
                  <span>已解决</span>
                </Badge>
              </Space>
            } 
            key="resolved" 
          />
          <TabPane tab="全部告警" key="all" />
        </Tabs>

        {/* 告警表格 */}
        <Table
          columns={columns}
          dataSource={filteredAlarms}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowClassName={(record) => {
            if (record.status === 'active' && record.severity === 'critical') {
              return styles.criticalRow
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
              <Descriptions.Item label="设备名称">
                {selectedAlarm.deviceName}
              </Descriptions.Item>
              <Descriptions.Item label="设备ID">
                {selectedAlarm.deviceId}
              </Descriptions.Item>
              <Descriptions.Item label="告警类型">
                {selectedAlarm.type}
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
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
                <span style={{ color: getSeverityColor(selectedAlarm.severity), fontWeight: 'bold' }}>
                  {selectedAlarm.value}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="阈值">
                {selectedAlarm.threshold}
              </Descriptions.Item>
              <Descriptions.Item label="告警信息" span={2}>
                {selectedAlarm.message}
              </Descriptions.Item>
              <Descriptions.Item label="触发时间" span={2}>
                {dayjs(selectedAlarm.timestamp).format('YYYY-MM-DD HH:mm:ss')}
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

            {selectedAlarm.notes && selectedAlarm.notes.length > 0 && (
              <Card title="处理记录" style={{ marginTop: 16 }}>
                <Timeline>
                  {selectedAlarm.notes.map((note, index) => (
                    <Timeline.Item key={index}>
                      {note}
                    </Timeline.Item>
                  ))}
                </Timeline>
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

      {/* 告警规则配置 */}
      <AlarmConfig
        visible={configVisible}
        onClose={() => setConfigVisible(false)}
      />
    </div>
  )
}

export default AlarmManagement