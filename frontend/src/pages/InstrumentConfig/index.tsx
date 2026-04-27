import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Row,
  Col,
  message,
  Modal,
  Form,
  InputNumber,
  Select,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
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
  deviceStatus: 'normal' | 'fault' | 'offline'
}

const deviceStatusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  normal: { text: '正常', color: 'green', icon: <CheckCircleOutlined /> },
  fault: { text: '故障', color: 'red', icon: <CloseCircleOutlined /> },
  offline: { text: '离线', color: 'default', icon: <ExclamationCircleOutlined /> },
}

const monitorTypeOptions = [
  '液位', '温度', '压力', '流量', '可燃气体',
  '有毒气体(H2S)', '有毒气体(NH3)', '有毒气体(CO)', '湿度', '振动',
]

const InstrumentConfig: React.FC = () => {
  const [data, setData] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Instrument | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (keyword) params.keyword = keyword
      const res = await request.get('/api/v1/instruments/config', { params })
      const list = res?.data?.data || res?.data || []
      setData(Array.isArray(list) ? list : [])
    } catch {
      message.error('获取配置列表失败')
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      deviceStatus: 'normal',
      rangeMin: 0,
      rangeMax: 100,
      threshold: { lowLow: null, low: null, high: null, highHigh: null },
    })
    setModalVisible(true)
  }

  // 打开编辑弹窗
  const handleEdit = (record: Instrument) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      thresholdLowLow: record.threshold.lowLow,
      thresholdLow: record.threshold.low,
      thresholdHigh: record.threshold.high,
      thresholdHighHigh: record.threshold.highHigh,
    })
    setModalVisible(true)
  }

  // 删除
  const handleDelete = async (id: string) => {
    try {
      const res = await request.delete(`/api/v1/instruments/${id}`)
      const body = res?.data
      if (body?.code === 0) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error(body?.message || '删除失败')
      }
    } catch {
      message.error('删除失败')
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const payload = {
        ...values,
        threshold: {
          lowLow: values.thresholdLowLow ?? null,
          low: values.thresholdLow ?? null,
          high: values.thresholdHigh ?? null,
          highHigh: values.thresholdHighHigh ?? null,
        },
      }
      delete payload.thresholdLowLow
      delete payload.thresholdLow
      delete payload.thresholdHigh
      delete payload.thresholdHighHigh

      let res
      if (editingRecord) {
        // 编辑
        res = await request.put(`/api/v1/instruments/${editingRecord.id}`, payload)
      } else {
        // 新增
        res = await request.post('/api/v1/instruments', payload)
      }
      const body = res?.data
      if (body?.code === 0) {
        message.success(editingRecord ? '更新成功' : '新增成功')
        setModalVisible(false)
        fetchData()
      } else {
        message.error(body?.message || '操作失败')
      }
    } catch (err: any) {
      // 表单验证错误不弹message
      if (err?.response?.data?.message) {
        message.error(err.response.data.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<Instrument> = [
    {
      title: '仪表编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
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
      width: 130,
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
      title: '计量单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '设备号',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 110,
    },
    {
      title: '通道号',
      dataIndex: 'channelId',
      key: 'channelId',
      width: 80,
    },
    {
      title: '量程范围',
      key: 'range',
      width: 130,
      render: (_: unknown, record: Instrument) => (
        <span>{record.rangeMin} ~ {record.rangeMax} {record.unit}</span>
      ),
    },
    {
      title: '阈值',
      key: 'threshold',
      width: 200,
      render: (_: unknown, record: Instrument) => {
        const t = record.threshold
        return (
          <Space size={4} wrap>
            {t.lowLow !== null && <Tag color="red">LL:{t.lowLow}</Tag>}
            {t.low !== null && <Tag color="orange">L:{t.low}</Tag>}
            {t.high !== null && <Tag color="orange">H:{t.high}</Tag>}
            {t.highHigh !== null && <Tag color="red">HH:{t.highHigh}</Tag>}
            {t.lowLow === null && t.low === null && t.high === null && t.highHigh === null && <span style={{ color: '#999' }}>未设置</span>}
          </Space>
        )
      },
    },
    {
      title: '经纬度',
      key: 'lnglat',
      width: 160,
      render: (_: unknown, record: Instrument) => {
        if (record.longitude && record.latitude) {
          return <span>{record.longitude.toFixed(4)}, {record.latitude.toFixed(4)}</span>
        }
        return <span style={{ color: '#999' }}>--</span>
      },
    },
    {
      title: '设备状态',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      width: 100,
      render: (status: string) => {
        const info = deviceStatusMap[status] || deviceStatusMap.offline
        return <Tag icon={info.icon} color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record: Instrument) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定删除仪表 ${record.id} 吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.instrumentConfig}>
      {/* 工具栏 */}
      <Card className={styles.toolbarCard}>
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索仪表编号/位置/设备号/监测类型"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增仪表
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card className={styles.tableCard}>
        <Table<Instrument>
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 15, showTotal: (total) => `共 ${total} 条`, showSizeChanger: true }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? `编辑仪表 - ${editingRecord.id}` : '新增仪表'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={720}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.configForm}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="id" label="仪表编号" rules={[{ required: true, message: '请输入仪表编号' }]}>
                <Input placeholder="如 YB-013" disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deviceId" label="设备号" rules={[{ required: true, message: '请输入设备号' }]}>
                <Input placeholder="如 DEV-A001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="channelId" label="通道号" rules={[{ required: true, message: '请输入通道号' }]}>
                <Input placeholder="如 CH-01" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="安装位置">
                <Input placeholder="如 储罐区A-1号储罐" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="monitorType" label="监测类型" rules={[{ required: true, message: '请选择监测类型' }]}>
                <Select placeholder="选择类型" allowClear showSearch>
                  {monitorTypeOptions.map(t => (
                    <Select.Option key={t} value={t}>{t}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unit" label="计量单位" rules={[{ required: true, message: '请输入单位' }]}>
                <Input placeholder="如 ℃、MPa" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="rangeMin" label="量程下限">
                <InputNumber style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="rangeMax" label="量程上限">
                <InputNumber style={{ width: '100%' }} placeholder="100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceStatus" label="设备状态">
                <Select>
                  <Select.Option value="normal">正常</Select.Option>
                  <Select.Option value="fault">故障</Select.Option>
                  <Select.Option value="offline">离线</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className={styles.sectionTitle}>阈值设置</div>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="thresholdLowLow" label="低二阈值(LL)">
                <InputNumber style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="thresholdLow" label="低一阈值(L)">
                <InputNumber style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="thresholdHigh" label="高一阈值(H)">
                <InputNumber style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="thresholdHighHigh" label="高二阈值(HH)">
                <InputNumber style={{ width: '100%' }} placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>

          <div className={styles.sectionTitle}>地理位置（选填）</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="longitude" label="经度">
                <InputNumber style={{ width: '100%' }} placeholder="如 121.4737" step={0.0001} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度">
                <InputNumber style={{ width: '100%' }} placeholder="如 31.2304" step={0.0001} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default InstrumentConfig
