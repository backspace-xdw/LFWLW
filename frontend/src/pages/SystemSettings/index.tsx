import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Tabs,
  Row,
  Col,
  Divider,
  Space,
  message,
  InputNumber,
  Tag,
} from 'antd'
import {
  SaveOutlined,
  GlobalOutlined,
  BellOutlined,
  SafetyOutlined,
  DatabaseOutlined,
} from '@ant-design/icons'

const { Option } = Select

const SystemSettings: React.FC = () => {
  const [generalForm] = Form.useForm()
  const [notifyForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const handleSave = async (formName: string, values: any) => {
    setSaving(true)
    try {
      localStorage.setItem(`settings_${formName}`, JSON.stringify(values))
      message.success('设置已保存')
    } finally {
      setSaving(false)
    }
  }

  const tabItems = [
    {
      key: 'general',
      label: <span><GlobalOutlined /> 基本设置</span>,
      children: (
        <Form
          form={generalForm}
          layout="vertical"
          initialValues={{
            systemName: 'LFWLW 物联网监控平台',
            timezone: 'Asia/Shanghai',
            language: 'zh_CN',
            dateFormat: 'YYYY-MM-DD HH:mm:ss',
            pageSize: 20,
            autoRefresh: true,
            refreshInterval: 5,
          }}
          onFinish={(v) => handleSave('general', v)}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="系统名称" name="systemName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="系统语言" name="language">
                <Select>
                  <Option value="zh_CN">简体中文</Option>
                  <Option value="en_US">English</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="时区" name="timezone">
                <Select>
                  <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">America/New_York (UTC-5)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="日期格式" name="dateFormat">
                <Select>
                  <Option value="YYYY-MM-DD HH:mm:ss">YYYY-MM-DD HH:mm:ss</Option>
                  <Option value="DD/MM/YYYY HH:mm">DD/MM/YYYY HH:mm</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="每页显示条数" name="pageSize">
                <Select>
                  {[10, 20, 50, 100].map(n => <Option key={n} value={n}>{n}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="自动刷新间隔 (秒)" name="refreshInterval">
                <InputNumber min={1} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="开启自动刷新" name="autoRefresh" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存设置</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'notify',
      label: <span><BellOutlined /> 告警通知</span>,
      children: (
        <Form
          form={notifyForm}
          layout="vertical"
          initialValues={{ enableEmail: false, emailRecipients: '', enableSms: false, smsRecipients: '', alarmLevel: ['critical', 'high'], notifyInterval: 30, enableSound: true }}
          onFinish={(v) => handleSave('notify', v)}
        >
          <Divider orientation="left">邮件通知</Divider>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="开启邮件通知" name="enableEmail" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item label="收件人邮箱 (逗号分隔)" name="emailRecipients">
                <Input placeholder="admin@example.com, ops@example.com" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">短信通知</Divider>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="开启短信通知" name="enableSms" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item label="接收手机 (逗号分隔)" name="smsRecipients">
                <Input placeholder="13800138000, 13900139000" />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">通知规则</Divider>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="通知告警级别" name="alarmLevel">
                <Select mode="multiple">
                  <Option value="critical"><Tag color="red">紧急</Tag></Option>
                  <Option value="high"><Tag color="orange">高</Tag></Option>
                  <Option value="medium"><Tag color="yellow">中</Tag></Option>
                  <Option value="low"><Tag color="blue">低</Tag></Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="重复通知间隔 (分钟)" name="notifyInterval">
                <InputNumber min={1} max={1440} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="声音告警" name="enableSound" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存设置</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'security',
      label: <span><SafetyOutlined /> 安全设置</span>,
      children: (
        <Form
          form={securityForm}
          layout="vertical"
          initialValues={{ sessionTimeout: 480, maxLoginAttempts: 5, passwordMinLength: 8, requireMfa: false, allowedIps: '', enableAuditLog: true }}
          onFinish={(v) => handleSave('security', v)}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="会话超时 (分钟)" name="sessionTimeout">
                <InputNumber min={30} max={1440} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最大登录失败次数" name="maxLoginAttempts">
                <InputNumber min={3} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="密码最小长度" name="passwordMinLength">
                <InputNumber min={6} max={32} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="启用双因素认证" name="requireMfa" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="启用操作审计日志" name="enableAuditLog" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="IP 白名单 (留空不限制)" name="allowedIps">
                <Input placeholder="192.168.1.0/24, 10.0.0.1" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>保存设置</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'data',
      label: <span><DatabaseOutlined /> 数据管理</span>,
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="数据保留策略" size="small">
              <Form layout="vertical">
                <Form.Item label="实时数据保留天数">
                  <InputNumber defaultValue={7} min={1} max={365} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="历史数据保留天数">
                  <InputNumber defaultValue={365} min={30} max={3650} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="告警记录保留天数">
                  <InputNumber defaultValue={180} min={30} max={3650} style={{ width: '100%' }} />
                </Form.Item>
                <Button type="primary" icon={<SaveOutlined />} onClick={() => message.success('策略已保存')}>保存策略</Button>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="系统信息" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><strong>平台版本：</strong>LFWLW v1.0.0</div>
                <div><strong>后端服务：</strong><Tag color="green">运行中 :50001</Tag></div>
                <div><strong>网关服务：</strong><Tag color="green">运行中 :50002</Tag></div>
                <div><strong>构建日期：</strong>{new Date().toLocaleDateString()}</div>
                <Divider />
                <Button
                  onClick={() => {
                    const token = localStorage.getItem('token')
                    fetch('/api/v1/', { headers: { Authorization: `Bearer ${token}` } })
                      .then(r => r.json())
                      .then(d => message.success(`API 连接正常: ${d.message || 'OK'}`))
                      .catch(() => message.error('API 连接失败'))
                  }}
                >
                  测试 API 连接
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
  ]

  return (
    <Card title="系统设置">
      <Tabs items={tabItems} />
    </Card>
  )
}

export default SystemSettings
