import React, { useEffect, useRef, useState } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import { Spin, Alert } from 'antd'
import type { Instrument } from './index'
import styles from './mapView.module.scss'

interface Props {
  instruments: Instrument[]
  focusKey?: string  // 设备树点击时变化, 用来 trigger 居中: "{id}__{ts}" 或 "__fitall__{ts}"
}

// AMap key 从 window.APP_CONFIG 读, 没配置则用 fallback 提示
const getAmapKey = (): string => {
  return (window as any).APP_CONFIG?.AMAP_KEY || ''
}
const getAmapSecurityCode = (): string => {
  return (window as any).APP_CONFIG?.AMAP_SECURITY_CODE || ''
}

// 状态 → marker 颜色
const statusColor = (inst: Instrument): string => {
  if (inst.deviceStatus === 'offline') return '#8898b8'
  if (inst.deviceStatus === 'fault') return '#ffa940'
  if (inst.alarmStatus !== 'none') return '#ff5e6c'
  return '#52e0a6'
}

// 状态 → 中文文字
const statusText = (inst: Instrument): string => {
  if (inst.deviceStatus === 'offline') return '离线'
  if (inst.deviceStatus === 'fault') return '故障'
  if (inst.alarmStatus !== 'none') {
    const map: Record<string, string> = {
      lowLow: '低低报警', low: '低报警', high: '高报警', highHigh: '高高报警'
    }
    return map[inst.alarmStatus] || '报警'
  }
  return '正常'
}

// 构造单个 marker 的 SVG (圆点 + 报警呼吸光圈)
// 注意: 用全局类名而非 CSS module hash 类, 因为 innerHTML 字符串无法引用 hash 类
const buildMarkerHTML = (inst: Instrument): string => {
  const color = statusColor(inst)
  const isAlarm = inst.alarmStatus !== 'none' && inst.deviceStatus !== 'offline'
  return `
    <div class="gis-marker-wrap">
      ${isAlarm ? `<div class="gis-marker-pulse" style="background:${color}"></div>` : ''}
      <div class="gis-marker-dot" style="background:${color}; box-shadow: 0 0 12px ${color}, 0 0 4px rgba(255,255,255,.4)"></div>
      <div class="gis-marker-label">${inst.id}</div>
    </div>
  `
}

// InfoWindow HTML (全局类名同上)
const buildInfoWindowHTML = (inst: Instrument): string => {
  const color = statusColor(inst)
  const status = statusText(inst)
  const valueDisplay = inst.value != null ? `${inst.value.toFixed(2)} ${inst.unit}` : '— —'
  const time = inst.collectTime ? new Date(inst.collectTime).toLocaleString('zh-CN') : '—'
  return `
    <div class="gis-popup">
      <div class="gis-popup-header" style="border-left-color:${color}">
        <span class="gis-popup-id">${inst.id}</span>
        <span class="gis-popup-badge" style="background:${color}">${status}</span>
      </div>
      <div class="gis-popup-body">
        <div class="gis-popup-row"><span class="gis-popup-label">位置</span><span class="gis-popup-value">${inst.location}</span></div>
        <div class="gis-popup-row"><span class="gis-popup-label">类型</span><span class="gis-popup-value">${inst.monitorType}</span></div>
        <div class="gis-popup-row"><span class="gis-popup-label">设备</span><span class="gis-popup-value">${inst.deviceId} / ${inst.channelId}</span></div>
        <div class="gis-popup-row"><span class="gis-popup-label">实时值</span><span class="gis-popup-value gis-popup-value-large" style="color:${color}">${valueDisplay}</span></div>
        <div class="gis-popup-row"><span class="gis-popup-label">量程</span><span class="gis-popup-value">${inst.rangeMin} ~ ${inst.rangeMax} ${inst.unit}</span></div>
        <div class="gis-popup-row"><span class="gis-popup-label">采集时间</span><span class="gis-popup-value">${time}</span></div>
      </div>
    </div>
  `
}

const MapView: React.FC<Props> = ({ instruments, focusKey }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const infoWindowRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 加载 AMap SDK + 初始化地图 (仅一次)
  useEffect(() => {
    const key = getAmapKey()
    if (!key) {
      setLoadError('未配置高德地图 Key, 请编辑 public/config.js 填入 AMAP_KEY')
      setLoading(false)
      return
    }

    // 高德安全密钥 (新版 API 必须)
    const sec = getAmapSecurityCode()
    if (sec) {
      ;(window as any)._AMapSecurityConfig = { securityJsCode: sec }
    }

    AMapLoader.load({
      key,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.HawkEye', 'AMap.MarkerCluster'],
    })
      .then((AMap) => {
        if (!containerRef.current) return
        const map = new AMap.Map(containerRef.current, {
          zoom: 15,
          mapStyle: 'amap://styles/dark', // 深色科技风地图样式
          viewMode: '2D',
        })
        map.addControl(new AMap.Scale())
        map.addControl(new AMap.ToolBar({ position: 'RB' }))
        map.addControl(new AMap.HawkEye({ isOpen: false }))

        infoWindowRef.current = new AMap.InfoWindow({
          isCustom: false,
          autoMove: true,
          offset: new AMap.Pixel(0, -28),
        })

        mapInstanceRef.current = { AMap, map }
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoadError('高德地图加载失败: ' + (e?.message || e))
        setLoading(false)
      })

    return () => {
      try { mapInstanceRef.current?.map?.destroy?.() } catch {}
      mapInstanceRef.current = null
      markersRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 同步 markers
  useEffect(() => {
    const inst = mapInstanceRef.current
    if (!inst) return
    const { AMap, map } = inst

    // 清掉旧 markers
    markersRef.current.forEach(m => map.remove(m))
    markersRef.current.clear()

    // 重建 markers
    instruments.forEach(d => {
      if (d.longitude == null || d.latitude == null) return
      const marker = new AMap.Marker({
        position: [d.longitude, d.latitude],
        content: buildMarkerHTML(d),
        offset: new AMap.Pixel(-12, -12),
        anchor: 'center',
        zIndex: d.alarmStatus !== 'none' ? 200 : 100,
      })
      marker.on('click', () => {
        infoWindowRef.current?.setContent(buildInfoWindowHTML(d))
        infoWindowRef.current?.open(map, [d.longitude!, d.latitude!])
      })
      map.add(marker)
      markersRef.current.set(d.id, marker)
    })

    // 自动 fit
    if (instruments.length > 0) {
      const positions = instruments
        .filter(d => d.longitude != null && d.latitude != null)
        .map(d => [d.longitude!, d.latitude!] as [number, number])
      if (positions.length === 1) {
        map.setCenter(positions[0])
        map.setZoom(17)
      } else if (positions.length > 1) {
        map.setFitView(Array.from(markersRef.current.values()), false, [60, 60, 60, 60], 18)
      }
    }
  }, [instruments])

  // 设备树点击 → 居中到对应 marker
  useEffect(() => {
    if (!focusKey) return
    const inst = mapInstanceRef.current
    if (!inst) return
    const { map } = inst

    if (focusKey.startsWith('__fitall__')) {
      // 居中所有
      if (markersRef.current.size > 0) {
        map.setFitView(Array.from(markersRef.current.values()), false, [60, 60, 60, 60], 18)
      }
      return
    }

    const id = focusKey.split('__')[0]
    const marker = markersRef.current.get(id)
    const target = instruments.find(i => i.id === id)
    if (marker && target && target.longitude != null && target.latitude != null) {
      map.setCenter([target.longitude, target.latitude])
      map.setZoom(18)
      // 自动弹出 info window
      infoWindowRef.current?.setContent(buildInfoWindowHTML(target))
      infoWindowRef.current?.open(map, [target.longitude, target.latitude])
    }
  }, [focusKey, instruments])

  return (
    <div className={styles.mapContainer}>
      <div ref={containerRef} className={styles.mapEl} />
      {loading && (
        <div className={styles.loadingOverlay}>
          <Spin tip="高德地图加载中..." size="large" />
        </div>
      )}
      {loadError && (
        <div className={styles.errorOverlay}>
          <Alert
            type="warning"
            showIcon
            message="地图未就绪"
            description={
              <div>
                <p>{loadError}</p>
                <p style={{ marginTop: 8 }}>
                  申请 Key: <a href="https://console.amap.com/dev/key/app" target="_blank" rel="noreferrer">https://console.amap.com/dev/key/app</a>
                </p>
                <p>申请后填到 <code>public/config.js</code> 的 <code>AMAP_KEY</code> 字段, 重新构建即可</p>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}

export default MapView
