import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Badge, Space, Button } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  MonitorOutlined,
  AlertOutlined,
  LineChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  CameraOutlined,
  BlockOutlined,
  BuildOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  SolutionOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import styles from './index.module.scss'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '监控仪表板',
  },
  {
    key: 'devices',
    icon: <AppstoreOutlined />,
    label: '设备管理',
  },
  {
    key: 'monitor',
    icon: <MonitorOutlined />,
    label: '实时监控',
  },
  {
    key: 'gis',
    icon: <EnvironmentOutlined />,
    label: 'GIS监控',
  },
  {
    key: 'instrument-config',
    icon: <ToolOutlined />,
    label: '配置管理',
  },
  {
    key: 'alarms',
    icon: <AlertOutlined />,
    label: '告警管理',
  },
  {
    key: 'alarm-handling',
    icon: <SolutionOutlined />,
    label: '告警处置',
  },
  {
    key: 'risk-warning',
    icon: <ThunderboltOutlined />,
    label: '风险预警',
  },
  {
    key: 'predictive-maintenance',
    icon: <ExperimentOutlined />,
    label: '预测性维护',
  },
  {
    key: 'analysis',
    icon: <LineChartOutlined />,
    label: '数据分析',
  },
  {
    key: 'models',
    icon: <CameraOutlined />,
    label: '3D模型',
  },
  {
    key: 'graphics-editor',
    icon: <BlockOutlined />,
    label: '2D图形编辑',
  },
  {
    key: 'digital-factory',
    icon: <BuildOutlined />,
    label: '数字工厂',
  },
  {
    key: 'users',
    icon: <TeamOutlined />,
    label: '用户管理',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
]

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(`/${key}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const selectedKey = location.pathname.split('/')[1] || 'dashboard'

  return (
    <Layout className={styles.layout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={styles.sider}
      >
        <div className={styles.logo}>
          <img src="/src/assets/logo.png" alt="Logo" />
          {!collapsed && <span>本安仪表</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className={styles.trigger}
            />
          </div>
          
          <div className={styles.headerRight}>
            <Space size={24}>
              <Badge count={5} className={styles.badge}>
                <BellOutlined className={styles.icon} />
              </Badge>
              
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space className={styles.userInfo}>
                  <Avatar src={user?.avatar} icon={<UserOutlined />} />
                  <span>{user?.fullName || user?.username}</span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout