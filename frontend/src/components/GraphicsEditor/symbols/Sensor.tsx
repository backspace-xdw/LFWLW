import React, { useEffect, useRef } from 'react'
import { Group, Circle, Rect, Text, Line, Ellipse } from 'react-konva'
import Konva from 'konva'

interface SensorProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  deviceId?: string
  deviceData?: any
  showLabel?: boolean
  hasAlarm?: boolean
  isMonitorMode?: boolean
  isSelected?: boolean
  sensorType?: 'temperature' | 'pressure' | 'humidity' | 'level' | 'flow' | 'generic'
  onSelect?: () => void
  onChange?: (attrs: any) => void
}

const Sensor: React.FC<SensorProps> = ({
  id,
  x,
  y,
  width,
  height,
  rotation = 0,
  deviceId,
  deviceData,
  showLabel = true,
  hasAlarm = false,
  isMonitorMode = false,
  isSelected = false,
  sensorType = 'generic',
  onSelect,
  onChange,
}) => {
  const pulseRef = useRef<Konva.Circle>(null)
  const signalRef = useRef<Konva.Group>(null)

  // 状态脉冲动画
  useEffect(() => {
    if (!isMonitorMode || !pulseRef.current || deviceData?.status !== 'online') {
      return () => {}
    }

    const layer = pulseRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const anim = new Konva.Animation((frame) => {
      if (!frame || !pulseRef.current) return
      const scale = 1 + Math.sin(frame.time * 0.004) * 0.08
      pulseRef.current.scale({ x: scale, y: scale })
      pulseRef.current.opacity(0.2 + Math.sin(frame.time * 0.004) * 0.15)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData?.status])

  // 信号动画
  useEffect(() => {
    if (!isMonitorMode || !signalRef.current || deviceData?.status !== 'online') {
      return () => {}
    }

    const layer = signalRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const anim = new Konva.Animation((frame) => {
      if (!frame || !signalRef.current) return
      const opacity = 0.3 + Math.sin(frame.time * 0.005) * 0.3
      signalRef.current.opacity(opacity)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData?.status])

  // 获取状态颜色
  const getStatusColor = () => {
    if (!deviceData) return { main: '#8c8c8c', light: '#bfbfbf', dark: '#595959' }
    if (deviceData.status === 'offline') return { main: '#8c8c8c', light: '#bfbfbf', dark: '#595959' }
    if (hasAlarm) return { main: '#ff4d4f', light: '#ff7875', dark: '#cf1322' }
    return { main: '#52c41a', light: '#95de64', dark: '#389e0d' }
  }

  // 获取传感器类型符号
  const getSensorSymbol = () => {
    switch (sensorType) {
      case 'temperature': return 'T'
      case 'pressure': return 'P'
      case 'humidity': return 'H'
      case 'level': return 'L'
      case 'flow': return 'F'
      default: return 'S'
    }
  }

  // 获取传感器类型颜色
  const getSensorTypeColor = () => {
    switch (sensorType) {
      case 'temperature': return { main: '#ff7a45', light: '#ffa940', dark: '#d4380d' }
      case 'pressure': return { main: '#1890ff', light: '#69c0ff', dark: '#096dd9' }
      case 'humidity': return { main: '#36cfc9', light: '#5cdbd3', dark: '#13a8a8' }
      case 'level': return { main: '#722ed1', light: '#9254de', dark: '#531dab' }
      case 'flow': return { main: '#eb2f96', light: '#f759ab', dark: '#c41d7f' }
      default: return { main: '#1890ff', light: '#69c0ff', dark: '#096dd9' }
    }
  }

  const colors = getStatusColor()
  const typeColors = getSensorTypeColor()
  const radius = Math.min(width, height) / 2

  const handleClick = () => {
    if (!isMonitorMode && onSelect) {
      onSelect()
    }
  }

  const handleDragEnd = (e: any) => {
    if (!isMonitorMode && onChange) {
      onChange({
        x: e.target.x(),
        y: e.target.y(),
      })
    }
  }

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable={!isMonitorMode}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
    >
      {/* 选中边框 */}
      {isSelected && (
        <Rect
          x={-radius - 8}
          y={-radius - 8}
          width={radius * 2 + 16}
          height={radius * 2 + 16}
          stroke="#1890ff"
          strokeWidth={2}
          dash={[6, 4]}
          cornerRadius={4}
        />
      )}

      {/* 状态发光效果 */}
      {isMonitorMode && deviceData?.status === 'online' && (
        <Circle
          ref={pulseRef}
          x={0}
          y={0}
          radius={radius + 5}
          fill={colors.main}
          opacity={0.2}
        />
      )}

      {/* 传感器阴影 */}
      <Ellipse
        x={2}
        y={3}
        radiusX={radius}
        radiusY={radius * 0.95}
        fill="#1a1a1a"
        opacity={0.25}
      />

      {/* 传感器外壳 - 3D渐变效果 */}
      <Circle
        x={0}
        y={0}
        radius={radius}
        fillRadialGradientStartPoint={{ x: -radius / 3, y: -radius / 3 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={radius}
        fillRadialGradientColorStops={[0, '#f5f5f5', 0.6, '#e8e8e8', 1, '#d9d9d9']}
        stroke="#666"
        strokeWidth={2}
      />

      {/* 金属边框环 */}
      <Circle
        x={0}
        y={0}
        radius={radius - 2}
        stroke="#888"
        strokeWidth={1}
      />

      {/* 状态指示环 */}
      <Circle
        x={0}
        y={0}
        radius={radius * 0.85}
        stroke={colors.main}
        strokeWidth={3}
      />

      {/* 传感器内芯 - 类型颜色 */}
      <Circle
        x={0}
        y={0}
        radius={radius * 0.6}
        fillRadialGradientStartPoint={{ x: -radius * 0.15, y: -radius * 0.15 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={radius * 0.6}
        fillRadialGradientColorStops={[0, typeColors.light, 0.6, typeColors.main, 1, typeColors.dark]}
        stroke="#333"
        strokeWidth={1}
      />

      {/* 传感器符号 */}
      <Text
        x={-radius * 0.4}
        y={-radius * 0.35}
        width={radius * 0.8}
        height={radius * 0.7}
        text={getSensorSymbol()}
        fontSize={radius * 0.7}
        fontStyle="bold"
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        shadowColor="#000"
        shadowBlur={2}
        shadowOpacity={0.3}
      />

      {/* 信号指示器 */}
      {isMonitorMode && deviceData?.status === 'online' && (
        <Group ref={signalRef} x={radius * 0.5} y={-radius * 0.5}>
          <Circle x={0} y={0} radius={3} fill={colors.main} />
          <Circle x={0} y={0} radius={6} stroke={colors.main} strokeWidth={1} opacity={0.6} />
          <Circle x={0} y={0} radius={9} stroke={colors.main} strokeWidth={1} opacity={0.3} />
        </Group>
      )}

      {/* 连接线 */}
      <Group y={radius}>
        {/* 连接管 */}
        <Rect
          x={-4}
          y={0}
          width={8}
          height={15}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 8, y: 0 }}
          fillLinearGradientColorStops={[0, '#888', 0.3, '#aaa', 0.7, '#999', 1, '#777']}
          stroke="#555"
          strokeWidth={1}
        />
        {/* 螺纹 */}
        {[3, 7, 11].map((y) => (
          <Line
            key={y}
            points={[-4, y, 4, y]}
            stroke="#666"
            strokeWidth={0.5}
          />
        ))}
      </Group>

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={radius + 28}>
          <Rect
            x={-45}
            y={-12}
            width={90}
            height={24}
            fill="white"
            stroke="#d9d9d9"
            strokeWidth={1}
            cornerRadius={4}
            shadowColor="#000"
            shadowBlur={4}
            shadowOpacity={0.1}
            shadowOffsetY={2}
          />
          <Text
            x={-45}
            y={-12}
            width={90}
            height={24}
            text={deviceId || id}
            fontSize={12}
            fontFamily="Arial"
            align="center"
            verticalAlign="middle"
            fill="#333"
          />
        </Group>
      )}

      {/* 数据显示面板 */}
      {isMonitorMode && deviceData?.data && (
        <Group x={radius + 18} y={0}>
          <Rect
            x={0}
            y={-25}
            width={75}
            height={50}
            fill={hasAlarm ? 'rgba(255,77,79,0.1)' : 'rgba(24,144,255,0.08)'}
            stroke={hasAlarm ? '#ff7875' : '#91d5ff'}
            strokeWidth={1}
            cornerRadius={6}
          />
          {/* 温度 */}
          {deviceData.data.temperature !== undefined && (
            <Group y={-18}>
              <Text
                x={5}
                y={0}
                text="温度"
                fontSize={9}
                fill="#8c8c8c"
              />
              <Text
                x={30}
                y={0}
                text={`${deviceData.data.temperature.toFixed(1)}°C`}
                fontSize={11}
                fontStyle="bold"
                fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
              />
            </Group>
          )}
          {/* 湿度 */}
          {deviceData.data.humidity !== undefined && (
            <Group y={-2}>
              <Text
                x={5}
                y={0}
                text="湿度"
                fontSize={9}
                fill="#8c8c8c"
              />
              <Text
                x={30}
                y={0}
                text={`${deviceData.data.humidity.toFixed(0)}%`}
                fontSize={11}
                fontStyle="bold"
                fill="#1890ff"
              />
            </Group>
          )}
          {/* 压力 */}
          {deviceData.data.pressure !== undefined && (
            <Group y={14}>
              <Text
                x={5}
                y={0}
                text="压力"
                fontSize={9}
                fill="#8c8c8c"
              />
              <Text
                x={30}
                y={0}
                text={`${deviceData.data.pressure.toFixed(2)} bar`}
                fontSize={10}
                fill="#1890ff"
              />
            </Group>
          )}
        </Group>
      )}

      {/* 告警指示器 */}
      {hasAlarm && (
        <Group x={radius * 0.6} y={-radius * 0.6}>
          <Circle
            x={0}
            y={0}
            radius={8}
            fill="#ff4d4f"
            stroke="#fff"
            strokeWidth={2}
            shadowColor="#ff4d4f"
            shadowBlur={10}
            shadowOpacity={0.6}
          />
          <Text
            x={-4}
            y={-6}
            text="!"
            fontSize={12}
            fontStyle="bold"
            fill="#fff"
          />
        </Group>
      )}

      {/* 运行状态指示灯 */}
      {isMonitorMode && (
        <Circle
          x={-radius * 0.6}
          y={-radius * 0.6}
          radius={4}
          fill={deviceData?.status === 'online' ? '#52c41a' : '#8c8c8c'}
          stroke="#fff"
          strokeWidth={1}
          shadowColor={deviceData?.status === 'online' ? '#52c41a' : 'transparent'}
          shadowBlur={deviceData?.status === 'online' ? 5 : 0}
        />
      )}
    </Group>
  )
}

export default Sensor
