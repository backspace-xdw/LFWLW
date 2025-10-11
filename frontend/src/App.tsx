import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DeviceList from './pages/DeviceList'
import DeviceDetail from './pages/DeviceDetail'
import RealtimeMonitor from './pages/RealtimeMonitor'
import AlarmManagement from './pages/AlarmManagement'
import DataAnalysis from './pages/DataAnalysis'
import SystemSettings from './pages/SystemSettings'
import UserManagement from './pages/UserManagement'
import Model3D from './pages/Model3D'
import VehicleMonitor from './pages/VehicleMonitor'
import GraphicsEditor from './pages/GraphicsEditor'
import Demo3D from './pages/Demo3D'
import { useAuthStore } from './store/auth'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <AntdApp>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/demo3d" element={<Demo3D />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="devices" element={<DeviceList />} />
            <Route path="devices/:id" element={<DeviceDetail />} />
            <Route path="monitor" element={<RealtimeMonitor />} />
            <Route path="alarms" element={<AlarmManagement />} />
            <Route path="analysis" element={<DataAnalysis />} />
            <Route path="models" element={<Model3D />} />
            <Route path="graphics-editor" element={<GraphicsEditor />} />
            <Route path="vehicle-monitor" element={<VehicleMonitor />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AntdApp>
  )
}

export default App