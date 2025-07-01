import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Divider,
  Tooltip,
} from 'antd'
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { request } from '@/utils/request'

const { Option } = Select

export interface AlarmRule {
  id: string
  name: string
  deviceId: string
  deviceName: string
  parameter: string
  type: 'HH' | 'H' | 'L' | 'LL' | 'ROC' | 'DEVIATION'
  enabled: boolean
  value: number
  unit: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  delay?: number // 延迟时间（秒）
  deadband?: number // 死区
  rocPeriod?: number // 变化率计算周期（分钟）
  description?: string
}

interface AlarmConfigProps {
  visible: boolean
  onClose: () => void
}

const AlarmConfig: React.FC<AlarmConfigProps> = ({ visible, onClose }) => {
  const [rules, setRules] = useState<AlarmRule[]>([])
  const [editRule, setEditRule] = useState<AlarmRule | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  // 告警类型配置
  const alarmTypes = {
    HH: { name: '高高报警', color: '#ff4d4f', severity: 'critical' },
    H: { name: '高报警', color: '#fa8c16', severity: 'high' },
    L: { name: '低报警', color: '#faad14', severity: 'medium' },
    LL: { name: '低低报警', color: '#ff4d4f', severity: 'critical' },
    ROC: { name: '变化率报警', color: '#1890ff', severity: 'medium' },
    DEVIATION: { name: '偏差报警', color: '#722ed1', severity: 'low' },
  }

  // 设备参数配置
  const deviceParameters = {
    PUMP_001: [
      { value: 'temperature', label: '温度', unit: '°C' },
      { value: 'pressure', label: '压力', unit: 'bar' },
      { value: 'flow', label: '流量', unit: 'm³/h' },
      { value: 'vibration', label: '振动', unit: 'mm/s' },
    ],
    VALVE_002: [
      { value: 'pressure', label: '压力', unit: 'bar' },
      { value: 'opening', label: '开度', unit: '%' },
      { value: 'temperature', label: '温度', unit: '°C' },
    ],
    SENSOR_003: [
      { value: 'temperature', label: '温度', unit: '°C' },
      { value: 'humidity', label: '湿度', unit: '%' },
    ],
    MOTOR_004: [
      { value: 'temperature', label: '温度', unit: '°C' },
      { value: 'current', label: '电流', unit: 'A' },
      { value: 'rpm', label: '转速', unit: 'rpm' },
      { value: 'power', label: '功率', unit: 'kW' },
    ],
    TANK_005: [
      { value: 'level', label: '液位', unit: '%' },
      { value: 'temperature', label: '温度', unit: '°C' },
      { value: 'pressure', label: '压力', unit: 'bar' },
    ],
  }

  useEffect(() => {
    if (visible) {
      loadAlarmRules()
    }
  }, [visible])

  const loadAlarmRules = async () => {
    setLoading(true)
    try {
      const response = await request.get('/alarm-rules')
      if (response.data?.success) {
        setRules(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load alarm rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule: AlarmRule) => {
    setEditRule(rule)
    form.setFieldsValue({
      ...rule,
      deviceParam: `${rule.deviceId}-${rule.parameter}`,
    })
    setFormVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      const response = await request.delete(`/alarm-rules/${id}`)
      if (response.data?.success) {
        setRules(rules.filter(r => r.id !== id))
        message.success('删除成功')
      }
    } catch (error) {
      console.error('Failed to delete alarm rule:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await request.put(`/alarm-rules/${id}`, { enabled })
      if (response.data?.success) {
        setRules(rules.map(r => r.id === id ? { ...r, enabled } : r))
        message.success(enabled ? '已启用' : '已禁用')
      }
    } catch (error) {
      console.error('Failed to toggle alarm rule:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // 解析设备和参数
      const [deviceId, parameter] = values.deviceParam.split('-')
      const deviceName = getDeviceName(deviceId)
      const paramInfo = deviceParameters[deviceId as keyof typeof deviceParameters]
        ?.find(p => p.value === parameter)
      
      const ruleData: AlarmRule = {
        id: editRule?.id || `rule_${Date.now()}`,
        name: values.name,
        deviceId,
        deviceName,
        parameter,
        type: values.type,
        enabled: values.enabled ?? true,
        value: values.value,
        unit: paramInfo?.unit || '',
        severity: alarmTypes[values.type as keyof typeof alarmTypes].severity as any,
        delay: values.delay,
        deadband: values.deadband,
        rocPeriod: values.rocPeriod,
        description: values.description,
      }
      
      if (editRule) {
        const response = await request.put(`/alarm-rules/${editRule.id}`, ruleData)
        if (response.data?.success) {
          setRules(rules.map(r => r.id === editRule.id ? ruleData : r))
          message.success('更新成功')
        }
      } else {
        const response = await request.post('/alarm-rules', ruleData)
        if (response.data?.success) {
          setRules([...rules, ruleData])
          message.success('添加成功')
        }
      }
      
      setFormVisible(false)
      form.resetFields()
      setEditRule(null)
    } catch (error) {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
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

  const columns: ColumnsType<AlarmRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '设备',
      key: 'device',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.deviceName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.parameter}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={alarmTypes[type as keyof typeof alarmTypes].color}>
          {alarmTypes[type as keyof typeof alarmTypes].name}
        </Tag>
      ),
    },
    {
      title: '阈值',
      key: 'value',
      width: 120,
      render: (_, record) => (
        <span>
          {record.value} {record.unit}
        </span>
      ),
    },
    {
      title: '延迟',
      dataIndex: 'delay',
      key: 'delay',
      width: 80,
      render: (delay?: number) => delay ? `${delay}s` : '-',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggle(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此规则吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Modal
        title={
          <Space>
            <SettingOutlined />
            告警规则配置
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={1000}
        footer={null}
      >
        <Card
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditRule(null)
                form.resetFields()
                setFormVisible(true)
              }}
            >
              新增规则
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={rules}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ y: 400 }}
          />
        </Card>

        <Card title="告警类型说明" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <h4>限值告警</h4>
              <Space direction="vertical" size="small">
                <div>
                  <Tag color="#ff4d4f">高高报警(HH)</Tag>
                  测量值超过高高限
                </div>
                <div>
                  <Tag color="#fa8c16">高报警(H)</Tag>
                  测量值超过高限
                </div>
                <div>
                  <Tag color="#faad14">低报警(L)</Tag>
                  测量值低于低限
                </div>
                <div>
                  <Tag color="#ff4d4f">低低报警(LL)</Tag>
                  测量值低于低低限
                </div>
              </Space>
            </Col>
            <Col span={8}>
              <h4>变化率告警</h4>
              <Space direction="vertical" size="small">
                <div>
                  <Tag color="#1890ff">变化率报警(ROC)</Tag>
                  单位时间内变化量超限
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  适用于检测参数快速变化的异常情况
                </div>
              </Space>
            </Col>
            <Col span={8}>
              <h4>偏差告警</h4>
              <Space direction="vertical" size="small">
                <div>
                  <Tag color="#722ed1">偏差报警(DEVIATION)</Tag>
                  与设定值的偏差超限
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  适用于需要保持稳定控制的参数
                </div>
              </Space>
            </Col>
          </Row>
        </Card>
      </Modal>

      {/* 规则编辑弹窗 */}
      <Modal
        title={editRule ? '编辑告警规则' : '新增告警规则'}
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setFormVisible(false)
          form.resetFields()
          setEditRule(null)
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
            delay: 10,
            deadband: 1,
            rocPeriod: 1,
          }}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deviceParam"
                label="设备参数"
                rules={[{ required: true, message: '请选择设备参数' }]}
              >
                <Select placeholder="请选择设备参数">
                  {Object.entries(deviceParameters).map(([deviceId, params]) => (
                    <Select.OptGroup key={deviceId} label={getDeviceName(deviceId)}>
                      {params.map(param => (
                        <Option key={`${deviceId}-${param.value}`} value={`${deviceId}-${param.value}`}>
                          {param.label} ({param.unit})
                        </Option>
                      ))}
                    </Select.OptGroup>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="告警类型"
                rules={[{ required: true, message: '请选择告警类型' }]}
              >
                <Select
                  placeholder="请选择告警类型"
                  onChange={(value) => {
                    // 根据类型调整表单
                    if (value === 'ROC') {
                      form.setFieldsValue({ rocPeriod: 1 })
                    }
                  }}
                >
                  {Object.entries(alarmTypes).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Tag color={config.color}>{config.name}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="value"
                label={
                  <Space>
                    阈值
                    <Tooltip title="触发告警的数值限制">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: '请输入阈值' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入阈值"
                  step={0.1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="delay"
                label={
                  <Space>
                    延迟时间(秒)
                    <Tooltip title="参数超限后延迟触发告警的时间">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={300}
                  placeholder="延迟时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deadband"
                label={
                  <Space>
                    死区
                    <Tooltip title="告警恢复的缓冲区间，避免频繁告警">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                  placeholder="死区值"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.type !== currentValues.type
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('type') === 'ROC' && (
                    <Form.Item
                      name="rocPeriod"
                      label={
                        <Space>
                          计算周期(分钟)
                          <Tooltip title="变化率计算的时间周期">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={1}
                        max={60}
                        placeholder="计算周期"
                      />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              rows={2}
              placeholder="请输入规则描述"
            />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default AlarmConfig