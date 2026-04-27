import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Dropdown,
  Modal,
  Form,
  message,
  Tooltip,
  Badge,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ControlOutlined,
  EyeOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  SettingOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { deviceService, Device } from '@/services/device'
import DeviceFormModal from './components/DeviceFormModal'
import DeviceControlModal from './components/DeviceControlModal'
import styles from './index.module.scss'

const { Search } = Input
const { Option } = Select

const DeviceList: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [total, setTotal] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 20,
    keyword: '',
    status: '',
    typeId: '',
    groupId: '',
  })
  
  // Modal states
  const [formModalVisible, setFormModalVisible] = useState(false)
  const [controlModalVisible, setControlModalVisible] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [controllingDevice, setControllingDevice] = useState<Device | null>(null)

  // Load devices
  useEffect(() => {
    loadDevices()
  }, [searchParams])

  const typeDisplayNames: Record<string, string> = {
    pump: '离心泵', valve: '电动阀门', sensor: '温度传感器', motor: '三相电机', tank: '储罐',
  }

  const loadDevices = async () => {
    try {
      setLoading(true)
      const res = await deviceService.getDeviceList({
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        keyword: searchParams.keyword || undefined,
        status: searchParams.status || undefined,
      })
      const body = res.data
      if (body.code === 0) {
        const items: Device[] = body.data.items.map((item: any) => ({
          id: item.deviceId,
          deviceId: item.deviceId,
          name: item.name,
          type: { id: item.type, name: item.type, displayName: typeDisplayNames[item.type] || item.type, category: item.type },
          model: item.model || '',
          status: item.status,
          location: { building: item.location || '', floor: '', area: '' },
          lastOnlineAt: item.lastSeen ? new Date(item.lastSeen).toISOString() : undefined,
          properties: { manufacturer: item.manufacturer },
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        setDevices(items)
        setTotal(body.data.total)
      }
    } catch (error) {
      message.error('加载设备列表失败')
    } finally {
      setLoading(false)
    }
  }

  // Status tag render
  const renderStatus = (status: string) => {
    const statusConfig = {
      online: { color: 'success', icon: <CheckCircleOutlined />, text: '在线' },
      offline: { color: 'default', icon: <CloseCircleOutlined />, text: '离线' },
      maintenance: { color: 'warning', icon: <SyncOutlined spin />, text: '维护中' },
      fault: { color: 'error', icon: <WarningOutlined />, text: '故障' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // Table columns
  const columns: ColumnsType<Device> = [
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 120,
      fixed: 'left',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <a onClick={() => navigate(`/devices/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '设备类型',
      dataIndex: ['type', 'displayName'],
      key: 'type',
      width: 120,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus,
    },
    {
      title: '位置',
      key: 'location',
      width: 200,
      render: (_, record) => {
        const { building, floor, area } = record.location || {}
        return `${building || '-'} ${floor || '-'} ${area || '-'}`
      },
    },
    {
      title: '最后在线',
      dataIndex: 'lastOnlineAt',
      key: 'lastOnlineAt',
      width: 160,
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/devices/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="设备控制">
            <Button
              type="link"
              icon={<ControlOutlined />}
              onClick={() => handleControl(record)}
              disabled={record.status !== 'online'}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'config',
                  label: '配置管理',
                  icon: <SettingOutlined />,
                },
                {
                  key: 'history',
                  label: '历史数据',
                  icon: <LineChartOutlined />,
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  label: '删除设备',
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ],
              onClick: ({ key }) => handleMoreAction(key, record),
            }}
          >
            <Button type="link" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  // Handlers
  const handleAdd = () => {
    setEditingDevice(null)
    setFormModalVisible(true)
  }

  const handleEdit = (device: Device) => {
    setEditingDevice(device)
    setFormModalVisible(true)
  }

  const handleControl = (device: Device) => {
    setControllingDevice(device)
    setControlModalVisible(true)
  }

  const handleMoreAction = (action: string, device: Device) => {
    switch (action) {
      case 'delete':
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除设备 "${device.name}" 吗？`,
          onOk: async () => {
            try {
              await deviceService.deleteDevice(device.id)
              message.success('删除成功')
              loadDevices()
            } catch (error) {
              message.error('删除失败')
            }
          },
        })
        break
      case 'config':
        navigate(`/devices/${device.id}/config`)
        break
      case 'history':
        navigate(`/devices/${device.id}/history`)
        break
    }
  }

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的设备')
      return
    }
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个设备吗？`,
      onOk: async () => {
        // Implement batch delete
        message.success('批量删除成功')
        setSelectedRowKeys([])
        loadDevices()
      },
    })
  }

  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, keyword: value, page: 1 }))
  }

  const handleStatusChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, status: value, page: 1 }))
  }

  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
    }))
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  }

  return (
    <div className={styles.deviceList}>
      <Card>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <h2>设备管理</h2>
            <Badge count={total} showZero color="#1890ff" />
          </div>
          <Space>
            <Button icon={<ImportOutlined />}>导入</Button>
            <Button icon={<ExportOutlined />}>导出</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加设备
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Row gutter={16} className={styles.filters}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索设备名称或ID"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="设备状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStatusChange}
            >
              <Option value="online">在线</Option>
              <Option value="offline">离线</Option>
              <Option value="maintenance">维护中</Option>
              <Option value="fault">故障</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select placeholder="设备类型" allowClear style={{ width: '100%' }}>
              <Option value="pump">离心泵</Option>
              <Option value="valve">电动阀门</Option>
              <Option value="sensor">传感器</Option>
              <Option value="motor">电机</Option>
              <Option value="tank">储罐</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select placeholder="设备分组" allowClear style={{ width: '100%' }}>
              <Option value="1">生产区</Option>
              <Option value="2">储存区</Option>
              <Option value="3">动力区</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadDevices}>
                刷新
              </Button>
              {selectedRowKeys.length > 0 && (
                <Button danger onClick={handleBatchDelete}>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={devices}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Device Form Modal */}
      <DeviceFormModal
        visible={formModalVisible}
        device={editingDevice}
        onCancel={() => setFormModalVisible(false)}
        onSuccess={() => {
          setFormModalVisible(false)
          loadDevices()
        }}
      />

      {/* Device Control Modal */}
      <DeviceControlModal
        visible={controlModalVisible}
        device={controllingDevice}
        onCancel={() => setControlModalVisible(false)}
      />
    </div>
  )
}

export default DeviceList