import React, { useEffect, useRef } from 'react'
import { Group, Circle, Rect, Text, Line, Ellipse } from 'react-konva'
import Konva from 'konva'

interface MotorProps {
  id: string
  x: number
  y: number
  width: number
  height?: number
  rotation?: number
  deviceId?: string
  deviceData?: any
  showLabel?: boolean
  hasAlarm?: boolean
  isMonitorMode?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onChange?: (attrs: any) => void
}

const Motor: React.FC<MotorProps> = ({
  id,
  x,
  y,
  width,
  height: _height,
  rotation = 0,
  deviceId,
  deviceData,
  showLabel = true,
  hasAlarm = false,
  isMonitorMode = false,
  isSelected = false,
  onSelect,
  onChange,
}) => {
  const fanRef = useRef<Konva.Group>(null)
  const pulseRef = useRef<Konva.Circle>(null)

  // 风扇旋转动画
  useEffect(() => {
    if (!isMonitorMode || deviceData?.status !== 'online' || !fanRef.current) {
      return
    }

    const layer = fanRef.current.getLayer()
    if (!layer) return

    const rpm = deviceData?.data?.rpm || 1500
    const speed = rpm / 1500 // 归一化速度
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const rot = (frame.time * speed * 0.3) % 360
      fanRef.current?.rotation(rot)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData])

  // 状态脉冲动画
  useEffect(() => {
    if (!isMonitorMode || !pulseRef.current) return

    const layer = pulseRef.current.getLayer()
    if (!layer) return

    const anim = new Konva.Animation((frame) => {
      if (!frame || !pulseRef.current) return
      const scale = 1 + Math.sin(frame.time * 0.003) * 0.1
      pulseRef.current.scale({ x: scale, y: scale })
      pulseRef.current.opacity(0.3 + Math.sin(frame.time * 0.003) * 0.2)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode])

  // 获取状态颜色
  const getStatusColor = () => {
    if (!deviceData) return { main: '#8c8c8c', light: '#bfbfbf', dark: '#595959' }
    if (deviceData.status === 'offline') return { main: '#8c8c8c', light: '#bfbfbf', dark: '#595959' }
    if (hasAlarm) return { main: '#ff4d4f', light: '#ff7875', dark: '#cf1322' }
    if (deviceData.data?.temperature > 85) return { main: '#fa8c16', light: '#ffc069', dark: '#d46b08' }
    return { main: '#52c41a', light: '#95de64', dark: '#389e0d' }
  }

  const colors = getStatusColor()
  const r = width / 2

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
          x={-r - 8}
          y={-r - 8}
          width={width + 16}
          height={width + 16}
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
          radius={r + 5}
          fill={colors.main}
          opacity={0.3}
        />
      )}

      {/* 电机外壳 - 3D效果 */}
      <Ellipse
        x={0}
        y={3}
        radiusX={r}
        radiusY={r * 0.95}
        fill="#1a1a1a"
        opacity={0.3}
      />

      {/* 电机主体 - 渐变效果 */}
      <Circle
        x={0}
        y={0}
        radius={r}
        fillRadialGradientStartPoint={{ x: -r / 3, y: -r / 3 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={r}
        fillRadialGradientColorStops={[0, colors.light, 0.7, colors.main, 1, colors.dark]}
        stroke="#333"
        strokeWidth={2}
      />

      {/* 金属边框环 */}
      <Circle
        x={0}
        y={0}
        radius={r - 2}
        stroke="#666"
        strokeWidth={1}
      />

      {/* 定子外环 */}
      <Circle
        x={0}
        y={0}
        radius={r * 0.75}
        fill="#f5f5f5"
        stroke="#999"
        strokeWidth={2}
      />

      {/* 定子内环 */}
      <Circle
        x={0}
        y={0}
        radius={r * 0.65}
        fillLinearGradientStartPoint={{ x: 0, y: -r * 0.65 }}
        fillLinearGradientEndPoint={{ x: 0, y: r * 0.65 }}
        fillLinearGradientColorStops={[0, '#e8e8e8', 0.5, '#ffffff', 1, '#d9d9d9']}
        stroke="#bbb"
        strokeWidth={1}
      />

      {/* 风扇叶片组 */}
      <Group ref={fanRef} x={0} y={0}>
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <Group key={angle} rotation={angle}>
            {/* 叶片 */}
            <Line
              points={[0, -r * 0.12, r * 0.08, -r * 0.5, -r * 0.08, -r * 0.5]}
              closed
              fill="#404040"
              stroke="#333"
              strokeWidth={1}
            />
          </Group>
        ))}
      </Group>

      {/* 中心轴承 - 3D效果 */}
      <Circle
        x={0}
        y={0}
        radius={r * 0.18}
        fillRadialGradientStartPoint={{ x: -r * 0.05, y: -r * 0.05 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={r * 0.18}
        fillRadialGradientColorStops={[0, '#666', 0.5, '#444', 1, '#222']}
        stroke="#111"
        strokeWidth={1}
      />

      {/* 中心点 */}
      <Circle
        x={0}
        y={0}
        radius={r * 0.06}
        fill="#888"
      />

      {/* M标记 */}
      <Text
        x={-r * 0.35}
        y={r * 0.35}
        text="M"
        fontSize={r * 0.4}
        fontStyle="bold"
        fontFamily="Arial"
        fill="#333"
      />

      {/* 接线端子 */}
      <Rect
        x={-r * 0.15}
        y={r - 4}
        width={r * 0.3}
        height={8}
        fill="#444"
        stroke="#222"
        strokeWidth={1}
        cornerRadius={2}
      />

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={r + 18}>
          <Rect
            x={-40}
            y={-12}
            width={80}
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
            x={-40}
            y={-12}
            width={80}
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
        <Group x={0} y={-r - 50}>
          <Rect
            x={-50}
            y={0}
            width={100}
            height={42}
            fill={hasAlarm ? 'rgba(255,77,79,0.1)' : 'rgba(24,144,255,0.08)'}
            stroke={hasAlarm ? '#ff7875' : '#91d5ff'}
            strokeWidth={1}
            cornerRadius={6}
          />
          {/* 温度 */}
          {deviceData.data.temperature !== undefined && (
            <Group y={8}>
              <Text
                x={-45}
                y={0}
                text="温度"
                fontSize={10}
                fill="#8c8c8c"
              />
              <Text
                x={5}
                y={0}
                text={`${deviceData.data.temperature.toFixed(1)}°C`}
                fontSize={12}
                fontStyle="bold"
                fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
              />
            </Group>
          )}
          {/* 转速 */}
          {deviceData.data.rpm !== undefined && (
            <Group y={24}>
              <Text
                x={-45}
                y={0}
                text="转速"
                fontSize={10}
                fill="#8c8c8c"
              />
              <Text
                x={5}
                y={0}
                text={`${deviceData.data.rpm} rpm`}
                fontSize={12}
                fontStyle="bold"
                fill="#1890ff"
              />
            </Group>
          )}
        </Group>
      )}

      {/* 告警指示器 */}
      {hasAlarm && (
        <Group x={r - 5} y={-r + 5}>
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
          x={-r + 8}
          y={-r + 8}
          radius={5}
          fill={deviceData?.status === 'online' ? '#52c41a' : '#8c8c8c'}
          stroke="#fff"
          strokeWidth={1}
          shadowColor={deviceData?.status === 'online' ? '#52c41a' : 'transparent'}
          shadowBlur={deviceData?.status === 'online' ? 6 : 0}
        />
      )}
    </Group>
  )
}

export default Motor
