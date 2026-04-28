import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DeviceList from './pages/DeviceList'
import DeviceDetail from './pages/DeviceDetail'
import RealtimeMonitor from './pages/RealtimeMonitor'
import GISMonitoring from './pages/GISMonitoring'
import AlarmManagement from './pages/AlarmManagement'
import DataAnalysis from './pages/DataAnalysis'
import SystemSettings from './pages/SystemSettings'
import UserManagement from './pages/UserManagement'
import Model3D from './pages/Model3D'
import GraphicsEditor from './pages/GraphicsEditor'
import Demo3D from './pages/Demo3D'
import DigitalFactory from './pages/DigitalFactory'
import FactoryArea from './pages/FactoryArea'
import DeviceDetail3D from './pages/DeviceDetail3D'
import InstrumentConfig from './pages/InstrumentConfig'
import AlarmHandling from './pages/AlarmHandling'
import RiskWarning from './pages/RiskWarning'
import PredictiveMaintenance from './pages/PredictiveMaintenance'
import { useAuthStore } from './store/auth'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <AntdApp>
      <BrowserRouter basename="/">
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
            <Route path="gis" element={<GISMonitoring />} />
            <Route path="instrument-config" element={<InstrumentConfig />} />
            <Route path="alarms" element={<AlarmManagement />} />
            <Route path="alarm-handling" element={<AlarmHandling />} />
            <Route path="risk-warning" element={<RiskWarning />} />
            <Route path="predictive-maintenance" element={<PredictiveMaintenance />} />
            <Route path="analysis" element={<DataAnalysis />} />
            <Route path="models" element={<Model3D />} />
            <Route path="graphics-editor" element={<GraphicsEditor />} />
            <Route path="factory-area" element={<FactoryArea />} />
            <Route path="digital-factory" element={<DigitalFactory />} />
            <Route path="device-detail/:deviceId" element={<DeviceDetail3D />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AntdApp>
  )
}

export default App