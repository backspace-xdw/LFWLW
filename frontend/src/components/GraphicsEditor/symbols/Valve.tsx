import React, { useEffect, useRef } from 'react'
import { Group, Rect, Line, Text, Circle, Ellipse } from 'react-konva'
import Konva from 'konva'

interface ValveProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  variant?: 'ball' | 'gate' | 'check'
  deviceId?: string
  deviceData?: any
  showLabel?: boolean
  hasAlarm?: boolean
  isMonitorMode?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onChange?: (attrs: any) => void
}

const Valve: React.FC<ValveProps> = ({
  id,
  x,
  y,
  width,
  height,
  rotation = 0,
  variant = 'ball',
  deviceId,
  deviceData,
  showLabel = true,
  hasAlarm = false,
  isMonitorMode = false,
  isSelected = false,
  onSelect,
  onChange,
}) => {
  const handleRef = useRef<Konva.Group>(null)
  const pulseRef = useRef<Konva.Circle>(null)

  // 获取开度（0-100）
  const getOpening = () => {
    if (!deviceData?.data?.opening) return 50
    return deviceData.data.opening
  }

  // 阀门开关动画
  useEffect(() => {
    if (!isMonitorMode || !handleRef.current) {
      return () => {}
    }

    const targetRotation = 90 - (getOpening() * 0.9)
    const currentRotation = handleRef.current.rotation()

    if (Math.abs(currentRotation - targetRotation) < 1) {
      return () => {}
    }

    const layer = handleRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const startRotation = currentRotation
    const startTime = Date.now()
    const duration = 500

    const anim = new Konva.Animation((frame) => {
      if (!frame || !handleRef.current) return
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const newRotation = startRotation + (targetRotation - startRotation) * eased
      handleRef.current.rotation(newRotation)

      if (progress >= 1) {
        anim.stop()
      }
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData?.data?.opening])

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
      const scale = 1 + Math.sin(frame.time * 0.003) * 0.05
      pulseRef.current.scale({ x: scale, y: scale })
      pulseRef.current.opacity(0.2 + Math.sin(frame.time * 0.003) * 0.1)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData?.status])

  // 获取状态颜色 - 根据阀门类型区分
  const getStatusColor = () => {
    if (!deviceData) {
      // 默认颜色根据variant区分
      if (variant === 'gate') return { main: '#faad14', light: '#ffc53d', dark: '#d48806' }
      if (variant === 'check') return { main: '#13c2c2', light: '#36cfc9', dark: '#08979c' }
      return { main: '#52c41a', light: '#95de64', dark: '#389e0d' } // ball valve green
    }
    if (deviceData.status === 'offline') return { main: '#8c8c8c', light: '#bfbfbf', dark: '#595959' }
    if (hasAlarm) return { main: '#ff4d4f', light: '#ff7875', dark: '#cf1322' }
    const opening = getOpening()
    if (opening === 0) return { main: '#ff4d4f', light: '#ff7875', dark: '#cf1322' }
    if (opening === 100) return { main: '#52c41a', light: '#95de64', dark: '#389e0d' }
    if (variant === 'gate') return { main: '#faad14', light: '#ffc53d', dark: '#d48806' }
    if (variant === 'check') return { main: '#13c2c2', light: '#36cfc9', dark: '#08979c' }
    return { main: '#1890ff', light: '#69c0ff', dark: '#096dd9' }
  }

  const colors = getStatusColor()
  const opening = getOpening()
  const w = width
  const h = height

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
      draggable={false}
      onClick={handleClick}
      onTap={handleClick}
    >
      {/* 选中边框 */}
      {isSelected && (
        <Rect
          x={-w / 2 - 8}
          y={-h / 2 - 8}
          width={w + 16}
          height={h + 16}
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
          radius={Math.max(w, h) / 2 + 5}
          fill={colors.main}
          opacity={0.2}
        />
      )}

      {/* 左侧管道 */}
      <Group x={-w / 2 - 15} y={0}>
        <Rect
          x={0}
          y={-h * 0.15}
          width={20}
          height={h * 0.3}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: h * 0.3 }}
          fillLinearGradientColorStops={[0, '#777', 0.5, '#999', 1, '#666']}
          stroke="#444"
          strokeWidth={1}
        />
        {/* 法兰 */}
        <Rect
          x={18}
          y={-h * 0.2}
          width={5}
          height={h * 0.4}
          fill="#555"
          stroke="#333"
          strokeWidth={1}
        />
      </Group>

      {/* 右侧管道 */}
      <Group x={w / 2 - 5} y={0}>
        <Rect
          x={0}
          y={-h * 0.15}
          width={20}
          height={h * 0.3}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: h * 0.3 }}
          fillLinearGradientColorStops={[0, '#777', 0.5, '#999', 1, '#666']}
          stroke="#444"
          strokeWidth={1}
        />
        {/* 法兰 */}
        <Rect
          x={-3}
          y={-h * 0.2}
          width={5}
          height={h * 0.4}
          fill="#555"
          stroke="#333"
          strokeWidth={1}
        />
      </Group>

      {/* 阀体阴影 */}
      <Ellipse
        x={2}
        y={3}
        radiusX={w * 0.35}
        radiusY={h * 0.45}
        fill="#1a1a1a"
        opacity={0.25}
      />

      {/* 阀体主体 - 蝶形 */}
      <Group>
        {/* 左半球 */}
        <Line
          points={[
            -w * 0.35, 0,
            -w * 0.15, -h * 0.4,
            0, -h * 0.15,
            0, h * 0.15,
            -w * 0.15, h * 0.4,
          ]}
          closed
          fillLinearGradientStartPoint={{ x: -w * 0.35, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: 0 }}
          fillLinearGradientColorStops={[0, colors.dark, 0.5, colors.main, 1, colors.light]}
          stroke="#333"
          strokeWidth={2}
        />
        {/* 右半球 */}
        <Line
          points={[
            w * 0.35, 0,
            w * 0.15, -h * 0.4,
            0, -h * 0.15,
            0, h * 0.15,
            w * 0.15, h * 0.4,
          ]}
          closed
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: w * 0.35, y: 0 }}
          fillLinearGradientColorStops={[0, colors.light, 0.5, colors.main, 1, colors.dark]}
          stroke="#333"
          strokeWidth={2}
        />
      </Group>

      {/* 中心密封环 */}
      <Circle
        x={0}
        y={0}
        radius={h * 0.18}
        fillRadialGradientStartPoint={{ x: -h * 0.05, y: -h * 0.05 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={h * 0.18}
        fillRadialGradientColorStops={[0, '#888', 0.5, '#666', 1, '#444']}
        stroke="#333"
        strokeWidth={1}
      />

      {/* 阀杆组 */}
      <Group ref={handleRef} x={0} y={0} rotation={90 - (opening * 0.9)}>
        {/* 阀杆 */}
        <Rect
          x={-3}
          y={-h * 0.5}
          width={6}
          height={h}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 6, y: 0 }}
          fillLinearGradientColorStops={[0, '#888', 0.3, '#aaa', 0.7, '#999', 1, '#777']}
          stroke="#555"
          strokeWidth={1}
        />
        {/* 阀杆端头 */}
        <Circle
          x={0}
          y={-h * 0.5}
          radius={5}
          fill="#666"
          stroke="#444"
          strokeWidth={1}
        />
        <Circle
          x={0}
          y={h * 0.5}
          radius={5}
          fill="#666"
          stroke="#444"
          strokeWidth={1}
        />
      </Group>

      {/* 阀体中心点 */}
      <Circle
        x={0}
        y={0}
        radius={h * 0.08}
        fillRadialGradientStartPoint={{ x: -2, y: -2 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={h * 0.08}
        fillRadialGradientColorStops={[0, '#999', 0.5, '#666', 1, '#444']}
        stroke="#333"
        strokeWidth={1}
      />

      {/* 止回阀箭头标记 */}
      {variant === 'check' && (
        <Line
          points={[-w * 0.12, -h * 0.15, w * 0.08, 0, -w * 0.12, h * 0.15]}
          closed
          fill="#08979c"
          stroke="#08979c"
          strokeWidth={1}
        />
      )}

      {/* 闸阀手轮 */}
      {variant === 'gate' && (
        <Group x={0} y={-h * 0.5 - 5}>
          <Circle x={0} y={0} radius={h * 0.15}
            fill="none" stroke="#d48806" strokeWidth={3} />
          <Line points={[-h * 0.12, 0, h * 0.12, 0]} stroke="#d48806" strokeWidth={2} />
          <Line points={[0, -h * 0.12, 0, h * 0.12]} stroke="#d48806" strokeWidth={2} />
        </Group>
      )}

      {/* 阀门类型标记 */}
      <Text
        x={w * 0.2}
        y={h * 0.25}
        text={variant === 'gate' ? 'GV' : variant === 'check' ? 'CV' : 'BV'}
        fontSize={Math.min(w, h) * 0.2}
        fontStyle="bold"
        fontFamily="Arial"
        fill={variant === 'gate' ? '#d48806' : variant === 'check' ? '#08979c' : '#389e0d'}
      />

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={h / 2 + 18}>
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
        <Group x={0} y={-h / 2 - 35}>
          <Rect
            x={-50}
            y={0}
            width={100}
            height={28}
            fill={hasAlarm ? 'rgba(255,77,79,0.1)' : 'rgba(24,144,255,0.08)'}
            stroke={hasAlarm ? '#ff7875' : '#91d5ff'}
            strokeWidth={1}
            cornerRadius={6}
          />
          {/* 开度显示 */}
          <Group y={8}>
            <Text
              x={-45}
              y={0}
              text="开度"
              fontSize={10}
              fill="#8c8c8c"
            />
            <Text
              x={-5}
              y={0}
              text={`${opening}%`}
              fontSize={14}
              fontStyle="bold"
              fill={opening === 0 ? '#ff4d4f' : opening === 100 ? '#52c41a' : '#1890ff'}
            />
            {/* 状态指示 */}
            <Text
              x={30}
              y={0}
              text={opening === 0 ? '关' : opening === 100 ? '开' : '中'}
              fontSize={10}
              fill={opening === 0 ? '#ff4d4f' : opening === 100 ? '#52c41a' : '#1890ff'}
            />
          </Group>
        </Group>
      )}

      {/* 告警指示器 */}
      {hasAlarm && (
        <Group x={w / 2 - 5} y={-h / 2 + 5}>
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
          x={-w / 2 + 8}
          y={-h / 2 + 8}
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

export default Valve
