import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Checkbox, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { authService } from '@/services/auth'
import ChangePasswordModal from '@/components/ChangePasswordModal'
import styles from './index.module.scss'

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [tempToken, setTempToken] = useState<string>('')
  const { login } = useAuthStore()

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      const response = await authService.login({
        username: values.username,
        password: values.password,
      })
      
      // 检查是否需要修改密码
      if (response.mustChangePassword) {
        setTempToken(response.tempToken)
        setChangePasswordVisible(true)
      } else {
        login(response.user, response.accessToken)
        
        // 检查密码是否过期
        if (response.passwordExpired) {
          message.warning('您的密码已过期，请尽快修改密码');
        }
        
        message.success('登录成功')
        navigate('/dashboard')
      }
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChangeSuccess = () => {
    setChangePasswordVisible(false)
    setTempToken('')
    message.info('请使用新密码重新登录');
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <img src="/src/assets/logo.png" alt="Logo" className={styles.logo} />
          <h1 className={styles.title}>LFWLW物联网监控平台</h1>
          <p className={styles.subtitle}>IoT Monitoring Platform</p>
        </div>
        
        <Form
          name="login"
          className={styles.loginForm}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>
          
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div className={styles.loginFooter}>
          <p>© 2024 LFWLW Platform. All rights reserved.</p>
        </div>
      </div>
      
      <div className={styles.loginBanner}>
        <div className={styles.bannerContent}>
          <h2>智能物联，远程掌控</h2>
          <p>为工业4.0时代打造的专业物联网监控平台</p>
          <ul className={styles.features}>
            <li>实时数据监控</li>
            <li>3D可视化展示</li>
            <li>智能告警管理</li>
            <li>多端统一体验</li>
          </ul>
        </div>
      </div>

      {/* 首次登录修改密码弹窗 */}
      <ChangePasswordModal
        visible={changePasswordVisible}
        isInitial={true}
        tempToken={tempToken}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  )
}

export default Login