import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Input, Select, Button, Space, message, Tooltip } from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  AimOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import request from '@/utils/request'
import DeviceTree from './DeviceTree'
import MapView from './MapView'
import styles from './index.module.scss'

export interface Instrument {
  id: string
  location: string
  monitorType: string
  unit: string
  rangeMin: number
  rangeMax: number
  longitude: number | null
  latitude: number | null
  deviceId: string
  channelId: string
  collectTime: string
  value: number | null
  deviceStatus: 'normal' | 'fault' | 'offline'
  alarmStatus: 'none' | 'lowLow' | 'low' | 'high' | 'highHigh'
}

const REFRESH_INTERVAL_MS = 30000

const GISMonitoring: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [monitorTypeFilter, setMonitorTypeFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [selectedIds, setSelectedIds] = useState<string[]>([]) // 设备树勾选
  const [focusedId, setFocusedId] = useState<string | undefined>() // 设备树点击
  const [fullscreen, setFullscreen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 拉取仪表数据 (request.ts 不 unwrap, res 是 AxiosResponse, 真数据在 res.data)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res: any = await request.get('/api/v1/instruments')
      const list = res?.data?.data || res?.data || []
      if (Array.isArray(list)) {
        setInstruments(list)
      }
    } catch (e) {
      console.error(e)
      message.error('加载设备位置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(fetchData, REFRESH_INTERVAL_MS)
    return () => clearInterval(t)
  }, [autoRefresh, fetchData])

  // 全屏切换
  const toggleFullscreen = () => {
    const root = document.querySelector(`.${styles.gisRoot}`) as HTMLElement | null
    if (!root) return
    if (!fullscreen) {
      root.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
    setFullscreen(!fullscreen)
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // 经过筛选/搜索的设备
  const filteredInstruments = useMemo(() => {
    return instruments.filter(inst => {
      // 必须有经纬度才能上地图
      if (inst.longitude == null || inst.latitude == null) return false
      // 关键字
      if (keyword) {
        const k = keyword.toLowerCase()
        if (
          !inst.id.toLowerCase().includes(k) &&
          !inst.location.toLowerCase().includes(k) &&
          !inst.deviceId.toLowerCase().includes(k)
        ) return false
      }
      if (monitorTypeFilter && inst.monitorType !== monitorTypeFilter) return false
      if (statusFilter) {
        if (statusFilter === 'normal' && !(inst.deviceStatus === 'normal' && inst.alarmStatus === 'none')) return false
        if (statusFilter === 'alarming' && inst.alarmStatus === 'none') return false
        if (statusFilter === 'fault' && inst.deviceStatus !== 'fault') return false
        if (statusFilter === 'offline' && inst.deviceStatus !== 'offline') return false
      }
      return true
    })
  }, [instruments, keyword, monitorTypeFilter, statusFilter])

  // 树勾选过滤后的最终展示设备
  const visibleInstruments = useMemo(() => {
    if (selectedIds.length === 0) return filteredInstruments
    const set = new Set(selectedIds)
    return filteredInstruments.filter(inst => set.has(inst.id))
  }, [filteredInstruments, selectedIds])

  // 状态统计
  const stats = useMemo(() => {
    const list = visibleInstruments
    return {
      total: list.length,
      normal: list.filter(i => i.deviceStatus === 'normal' && i.alarmStatus === 'none').length,
      alarming: list.filter(i => i.alarmStatus !== 'none').length,
      fault: list.filter(i => i.deviceStatus === 'fault').length,
      offline: list.filter(i => i.deviceStatus === 'offline').length,
    }
  }, [visibleInstruments])

  const monitorTypes = useMemo(
    () => [...new Set(instruments.map(i => i.monitorType))],
    [instruments]
  )

  return (
    <div className={`${styles.gisRoot} ${fullscreen ? styles.fullscreen : ''}`}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索仪表编号/位置/设备号"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            placeholder="监测类型"
            value={monitorTypeFilter}
            onChange={setMonitorTypeFilter}
            allowClear
            style={{ width: 140 }}
          >
            {monitorTypes.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
          </Select>
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 120 }}
          >
            <Select.Option value="normal">正常</Select.Option>
            <Select.Option value="alarming">报警中</Select.Option>
            <Select.Option value="fault">故障</Select.Option>
            <Select.Option value="offline">离线</Select.Option>
          </Select>
        </Space>

        <Space>
          <Tooltip title="居中所有设备">
            <Button
              icon={<AimOutlined />}
              onClick={() => setFocusedId(`__fitall__${Date.now()}`)}
            />
          </Tooltip>
          <Tooltip title={autoRefresh ? '关闭自动刷新' : '开启自动刷新 (30s)'}>
            <Button
              type={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? '自动 30s' : '手动'}
            </Button>
          </Tooltip>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
          <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
            <Button
              icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 主内容区 */}
      <div className={styles.body}>
        {/* 左侧设备树 */}
        <aside className={styles.sidebar}>
          <DeviceTree
            instruments={filteredInstruments}
            selectedIds={selectedIds}
            onCheckChange={setSelectedIds}
            onNodeClick={id => setFocusedId(`${id}__${Date.now()}`)}
          />
        </aside>

        {/* 右侧地图 */}
        <main className={styles.mapPane}>
          <MapView
            instruments={visibleInstruments}
            focusKey={focusedId}
          />

          {/* 状态图例 */}
          <div className={styles.legend}>
            <div className={styles.legendTitle}>
              <EnvironmentOutlined /> 状态图例
            </div>
            <div className={styles.legendRow}><span className={styles.dotGreen} />正常 ({stats.normal})</div>
            <div className={styles.legendRow}><span className={styles.dotRed} />报警 ({stats.alarming})</div>
            <div className={styles.legendRow}><span className={styles.dotOrange} />故障 ({stats.fault})</div>
            <div className={styles.legendRow}><span className={styles.dotGray} />离线 ({stats.offline})</div>
          </div>

          {/* 顶部统计胶囊 */}
          <div className={styles.statCapsule}>
            <div><span className={styles.capsuleLabel}>展示</span>{stats.total}</div>
            <div className={styles.capsuleSep} />
            <div><span className={styles.capsuleLabel}>报警</span><b className={styles.red}>{stats.alarming}</b></div>
            <div className={styles.capsuleSep} />
            <div><span className={styles.capsuleLabel}>故障</span><b className={styles.orange}>{stats.fault}</b></div>
            <div className={styles.capsuleSep} />
            <div><span className={styles.capsuleLabel}>离线</span><b className={styles.gray}>{stats.offline}</b></div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default GISMonitoring
