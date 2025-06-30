import React, { useState } from 'react'
import { Modal, Form, Select, InputNumber, Switch, Button, Space, Divider, message, Alert } from 'antd'
import { Device, deviceService } from '@/services/device'
import { PlayCircleOutlined, StopOutlined, SettingOutlined } from '@ant-design/icons'

const { Option } = Select

interface DeviceControlModalProps {
  visible: boolean
  device: Device | null
  onCancel: () => void
}

const DeviceControlModal: React.FC<DeviceControlModalProps> = ({
  visible,
  device,
  onCancel,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [controlResult, setControlResult] = useState<any>(null)

  const handleControl = async (command: string, parameters?: any) => {
    if (!device) return

    try {
      setLoading(true)
      const result = await deviceService.controlDevice(device.id, {
        command,
        parameters,
        timeout: 30,
      })
      
      if (result.success) {
        message.success(`命令 "${command}" 执行成功`)
        setControlResult(result)
      } else {
        message.error(result.error || '命令执行失败')
      }
    } catch (error: any) {
      message.error(error.message || '控制失败')
    } finally {
      setLoading(false)
    }
  }

  const renderControlPanel = () => {
    if (!device) return null

    // 根据设备类型渲染不同的控制面板
    switch (device.type.name) {
      case 'pump':
        return (
          <>
            <Form.Item label="泵控制">
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleControl('start')}
                  loading={loading}
                >
                  启动
                </Button>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => handleControl('stop')}
                  loading={loading}
                >
                  停止
                </Button>
              </Space>
            </Form.Item>
            <Form.Item label="转速设置" name="speed">
              <InputNumber
                min={0}
                max={3000}
                step={100}
                addonAfter="RPM"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                icon={<SettingOutlined />}
                onClick={() => {
                  const speed = form.getFieldValue('speed')
                  if (speed !== undefined) {
                    handleControl('setSpeed', { speed })
                  }
                }}
                loading={loading}
              >
                设置转速
              </Button>
            </Form.Item>
          </>
        )

      case 'valve':
        return (
          <>
            <Form.Item label="阀门控制">
              <Space>
                <Button
                  type="primary"
                  onClick={() => handleControl('open')}
                  loading={loading}
                >
                  打开
                </Button>
                <Button
                  danger
                  onClick={() => handleControl('close')}
                  loading={loading}
                >
                  关闭
                </Button>
              </Space>
            </Form.Item>
            <Form.Item label="开度设置" name="position">
              <InputNumber
                min={0}
                max={100}
                step={10}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                icon={<SettingOutlined />}
                onClick={() => {
                  const position = form.getFieldValue('position')
                  if (position !== undefined) {
                    handleControl('setPosition', { position })
                  }
                }}
                loading={loading}
              >
                设置开度
              </Button>
            </Form.Item>
          </>
        )

      case 'motor':
        return (
          <>
            <Form.Item label="电机控制">
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleControl('start')}
                  loading={loading}
                >
                  启动
                </Button>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => handleControl('stop')}
                  loading={loading}
                >
                  停止
                </Button>
                <Button
                  onClick={() => handleControl('reset')}
                  loading={loading}
                >
                  复位
                </Button>
              </Space>
            </Form.Item>
            <Form.Item label="正反转" name="direction">
              <Select defaultValue="forward" style={{ width: '100%' }}>
                <Option value="forward">正转</Option>
                <Option value="reverse">反转</Option>
              </Select>
            </Form.Item>
            <Form.Item label="频率设置" name="frequency">
              <InputNumber
                min={0}
                max={60}
                step={5}
                addonAfter="Hz"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                icon={<SettingOutlined />}
                onClick={() => {
                  const values = form.getFieldsValue(['direction', 'frequency'])
                  handleControl('setParameters', values)
                }}
                loading={loading}
              >
                应用设置
              </Button>
            </Form.Item>
          </>
        )

      default:
        return (
          <Alert
            message="该设备类型暂不支持远程控制"
            type="info"
            showIcon
          />
        )
    }
  }

  return (
    <Modal
      title={`设备控制 - ${device?.name || ''}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
      width={600}
      destroyOnClose
    >
      {device && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Space split={<Divider type="vertical" />}>
              <span>设备ID: {device.deviceId}</span>
              <span>类型: {device.type.displayName}</span>
              <span>状态: {device.status === 'online' ? '在线' : '离线'}</span>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              speed: 1500,
              position: 50,
              direction: 'forward',
              frequency: 50,
            }}
          >
            {renderControlPanel()}
          </Form>

          {controlResult && (
            <Alert
              message="执行结果"
              description={
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(controlResult, null, 2)}
                </pre>
              }
              type="success"
              showIcon
              closable
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}
    </Modal>
  )
}

export default DeviceControlModal