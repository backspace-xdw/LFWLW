import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Space, Button, Row, Col, Statistic, Alert } from 'antd'
import { EnvironmentOutlined, CarOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Vehicle } from '../index'
import styles from './VehicleMap.module.scss'

interface VehicleMapSimpleProps {
  vehicles: Vehicle[]
  center: [number, number]
  onVehicleClick?: (vehicleId: string) => void
}

const VehicleMapSimple: React.FC<VehicleMapSimpleProps> = ({
  vehicles,
  center,
  onVehicleClick
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const getStatusTag = (status: Vehicle['status']) => {
    const statusConfig = {
      'online': { color: 'success', text: '在线' },
      'offline': { color: 'default', text: '离线' },
      'moving': { color: 'processing', text: '行驶中' },
      'stopped': { color: 'warning', text: '停止' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getVehicleTypeIcon = (type: Vehicle['type']) => {
    const icons = {
      'car': '🚗',
      'truck': '🚚',
      'bus': '🚌',
      'other': '🚙'
    }
    return icons[type] || '🚗'
  }

  const columns = [
    {
      title: '车辆',
      key: 'vehicle',
      render: (record: Vehicle) => (
        <Space>
          <span style={{ fontSize: '20px' }}>{getVehicleTypeIcon(record.type)}</span>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ color: '#999', fontSize: '12px' }}>{record.plateNumber}</div>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Vehicle['status']) => getStatusTag(status)
    },
    {
      title: '位置',
      key: 'location',
      render: (record: Vehicle) => (
        <Space direction="vertical" size={0}>
          <span>
            <EnvironmentOutlined /> {record.location.longitude.toFixed(6)}, {record.location.latitude.toFixed(6)}
          </span>
          {record.location.speed !== undefined && (
            <span style={{ color: '#666' }}>速度: {record.location.speed} km/h</span>
          )}
        </Space>
      )
    },
    {
      title: '司机',
      key: 'driver',
      render: (record: Vehicle) => record.driver ? (
        <Space direction="vertical" size={0}>
          <span>{record.driver.name}</span>
          <span style={{ color: '#666', fontSize: '12px' }}>
            <PhoneOutlined /> {record.driver.phone}
          </span>
        </Space>
      ) : '-'
    },
    {
      title: '更新时间',
      key: 'updateTime',
      render: (record: Vehicle) => (
        <span>
          <ClockCircleOutlined /> {new Date(record.location.updateTime).toLocaleString()}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Vehicle) => (
        <Button 
          type="link" 
          onClick={() => {
            setSelectedVehicle(record)
            onVehicleClick?.(record.id)
          }}
        >
          查看详情
        </Button>
      )
    }
  ]

  // 统计数据
  const stats = {
    total: vehicles.length,
    online: vehicles.filter(v => v.status === 'online' || v.status === 'moving').length,
    moving: vehicles.filter(v => v.status === 'moving').length,
    stopped: vehicles.filter(v => v.status === 'stopped').length
  }

  return (
    <div className={styles.mapContainer}>
      <Alert
        message="地图功能提示"
        description="高德地图API密钥未配置。请在 /frontend/src/config/map.ts 中配置您的高德地图API密钥。当前显示列表模式。"
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="车辆总数" 
              value={stats.total} 
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="在线车辆" 
              value={stats.online} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="行驶中" 
              value={stats.moving} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="停止" 
              value={stats.stopped} 
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="车辆列表" style={{ marginBottom: 16 }}>
        <Table
          dataSource={vehicles}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ y: 400 }}
        />
      </Card>

      {selectedVehicle && (
        <Card title="选中车辆详情" extra={
          <Button type="text" onClick={() => setSelectedVehicle(null)}>关闭</Button>
        }>
          <Row gutter={16}>
            <Col span={12}>
              <p><strong>车辆名称:</strong> {selectedVehicle.name}</p>
              <p><strong>车牌号:</strong> {selectedVehicle.plateNumber}</p>
              <p><strong>车辆类型:</strong> {selectedVehicle.type}</p>
              <p><strong>当前状态:</strong> {getStatusTag(selectedVehicle.status)}</p>
            </Col>
            <Col span={12}>
              <p><strong>经度:</strong> {selectedVehicle.location.longitude}</p>
              <p><strong>纬度:</strong> {selectedVehicle.location.latitude}</p>
              {selectedVehicle.location.speed !== undefined && (
                <p><strong>速度:</strong> {selectedVehicle.location.speed} km/h</p>
              )}
              {selectedVehicle.location.direction !== undefined && (
                <p><strong>方向:</strong> {selectedVehicle.location.direction}°</p>
              )}
            </Col>
          </Row>
          {selectedVehicle.driver && (
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <h4>司机信息</h4>
                <p><strong>姓名:</strong> {selectedVehicle.driver.name}</p>
                <p><strong>电话:</strong> {selectedVehicle.driver.phone}</p>
              </Col>
            </Row>
          )}
        </Card>
      )}
    </div>
  )
}

export default VehicleMapSimple