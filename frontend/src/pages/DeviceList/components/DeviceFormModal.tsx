import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, Row, Col, message } from 'antd'
import { Device, CreateDeviceData, deviceService } from '@/services/device'

const { Option } = Select

interface DeviceFormModalProps {
  visible: boolean
  device: Device | null
  onCancel: () => void
  onSuccess: () => void
}

const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  visible,
  device,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)

  useEffect(() => {
    if (visible && device) {
      // Edit mode - fill form with device data
      form.setFieldsValue({
        deviceId: device.deviceId,
        name: device.name,
        typeId: device.type.id,
        model: device.model,
        manufacturer: device.manufacturer,
        serialNumber: device.serialNumber,
        building: device.location?.building,
        floor: device.location?.floor,
        area: device.location?.area,
        groupId: device.group?.id,
      })
    } else {
      // Add mode - reset form
      form.resetFields()
    }
  }, [visible, device, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const data: CreateDeviceData = {
        deviceId: values.deviceId,
        name: values.name,
        typeId: values.typeId,
        model: values.model,
        manufacturer: values.manufacturer,
        serialNumber: values.serialNumber,
        location: {
          building: values.building,
          floor: values.floor,
          area: values.area,
        },
        groupId: values.groupId,
        properties: {},
        metadata: {},
      }

      if (device) {
        // Update existing device
        await deviceService.updateDevice(device.id, data)
        message.success('设备更新成功')
      } else {
        // Create new device
        await deviceService.createDevice(data)
        message.success('设备创建成功')
      }

      onSuccess()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={device ? '编辑设备' : '添加设备'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={720}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="deviceId"
              label="设备ID"
              rules={[
                { required: true, message: '请输入设备ID' },
                { pattern: /^[A-Z0-9_]+$/, message: '只能包含大写字母、数字和下划线' },
              ]}
            >
              <Input placeholder="如: PUMP_001" disabled={!!device} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="设备名称"
              rules={[{ required: true, message: '请输入设备名称' }]}
            >
              <Input placeholder="如: 离心泵 #001" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="typeId"
              label="设备类型"
              rules={[{ required: true, message: '请选择设备类型' }]}
            >
              <Select placeholder="请选择设备类型">
                <Option value="1">离心泵</Option>
                <Option value="2">电动阀门</Option>
                <Option value="3">温度传感器</Option>
                <Option value="4">三相电机</Option>
                <Option value="5">储罐</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="model"
              label="设备型号"
            >
              <Input placeholder="如: CP-2000" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="manufacturer"
              label="制造商"
            >
              <Input placeholder="如: 西门子" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="serialNumber"
              label="序列号"
            >
              <Input placeholder="设备序列号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="building"
              label="所在建筑"
            >
              <Input placeholder="如: A栋" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="floor"
              label="楼层"
            >
              <Input placeholder="如: 1F" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="area"
              label="区域"
            >
              <Input placeholder="如: 泵房" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="groupId"
              label="设备分组"
            >
              <Select placeholder="请选择设备分组" allowClear>
                <Option value="1">生产区</Option>
                <Option value="2">储存区</Option>
                <Option value="3">动力区</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default DeviceFormModal