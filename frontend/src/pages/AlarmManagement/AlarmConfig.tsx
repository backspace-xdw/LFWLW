import React, { useState, useEffect } from 'react'
import {
  Modal,
  Table,
  Tag,
  Space,
  Button,
  message,
} from 'antd'
import {
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import request from '@/utils/request'
import { useNavigate } from 'react-router-dom'

interface InstrumentConfig {
  id: string
  location: string
  monitorType: string
  unit: string
  threshold: {
    lowLow: number | null
    low: number | null
    high: number | null
    highHigh: number | null
  }
  rangeMin: number
  rangeMax: number
  deviceId: string
  channelId: string
  deviceStatus: 'normal' | 'fault' | 'offline'
}

interface AlarmConfigProps {
  visible: boolean
  onClose: () => void
}

const deviceStatusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  normal: { text: '正常', color: 'green', icon: <CheckCircleOutlined /> },
  fault: { text: '故障', color: 'red', icon: <CloseCircleOutlined /> },
  offline: { text: '离线', color: 'default', icon: <ExclamationCircleOutlined /> },
}

const AlarmConfig: React.FC<AlarmConfigProps> = ({ visible, onClose }) => {
  const [instruments, setInstruments] = useState<InstrumentConfig[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (visible) {
      loadInstruments()
    }
  }, [visible])

  const loadInstruments = async () => {
    setLoading(true)
    try {
      const res = await request.get('/api/v1/instruments/config')
      const list = res?.data?.data || res?.data || []
      setInstruments(Array.isArray(list) ? list : [])
    } catch {
      message.error('获取仪表配置失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<InstrumentConfig> = [
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
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
    },
    {
      title: '量程',
      key: 'range',
      width: 130,
      render: (_: unknown, record: InstrumentConfig) => (
        <span>{record.rangeMin} ~ {record.rangeMax} {record.unit}</span>
      ),
    },
    {
      title: '低低(LL)',
      key: 'lowLow',
      width: 90,
      render: (_: unknown, record: InstrumentConfig) =>
        record.threshold.lowLow !== null
          ? <Tag color="red">{record.threshold.lowLow}</Tag>
          : <span style={{ color: '#ccc' }}>--</span>,
    },
    {
      title: '低(L)',
      key: 'low',
      width: 80,
      render: (_: unknown, record: InstrumentConfig) =>
        record.threshold.low !== null
          ? <Tag color="gold">{record.threshold.low}</Tag>
          : <span style={{ color: '#ccc' }}>--</span>,
    },
    {
      title: '高(H)',
      key: 'high',
      width: 80,
      render: (_: unknown, record: InstrumentConfig) =>
        record.threshold.high !== null
          ? <Tag color="orange">{record.threshold.high}</Tag>
          : <span style={{ color: '#ccc' }}>--</span>,
    },
    {
      title: '高高(HH)',
      key: 'highHigh',
      width: 90,
      render: (_: unknown, record: InstrumentConfig) =>
        record.threshold.highHigh !== null
          ? <Tag color="red">{record.threshold.highHigh}</Tag>
          : <span style={{ color: '#ccc' }}>--</span>,
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
  ]

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          仪表阈值总览
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1100}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button
            type="primary"
            onClick={() => {
              onClose()
              navigate('/instrument-config')
            }}
          >
            前往配置管理
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 12, color: '#666', fontSize: 14 }}>
        以下展示各仪表的报警阈值设置，如需修改请前往「配置管理」模块。当仪表实时采集值触发阈值时将自动产生告警。
      </div>
      <Table<InstrumentConfig>
        columns={columns}
        dataSource={instruments}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1000, y: 450 }}
        size="middle"
      />

      <div style={{ marginTop: 16, padding: '12px 16px', background: '#f6f8fa', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>报警规则说明</div>
        <Space size={24} wrap>
          <span><Tag color="red">高高报警(HH)</Tag> 数值 ≥ HH阈值 → 严重</span>
          <span><Tag color="orange">高报警(H)</Tag> 数值 ≥ H阈值 → 高</span>
          <span><Tag color="gold">低报警(L)</Tag> 数值 ≤ L阈值 → 中</span>
          <span><Tag color="red">低低报警(LL)</Tag> 数值 ≤ LL阈值 → 严重</span>
        </Space>
      </div>
    </Modal>
  )
}

export default AlarmConfig
