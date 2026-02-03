import React, { useEffect, useRef } from 'react'
import { Group, Circle, Rect, Text, Line, Ellipse, Arc } from 'react-konva'
import Konva from 'konva'

interface PumpProps {
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
  onSelect?: () => void
  onChange?: (attrs: any) => void
}

const Pump: React.FC<PumpProps> = ({
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
  onSelect,
  onChange,
}) => {
  const impellerRef = useRef<Konva.Group>(null)
  const pulseRef = useRef<Konva.Circle>(null)

  // 叶轮旋转动画
  useEffect(() => {
    if (!isMonitorMode || deviceData?.status !== 'online' || !impellerRef.current) {
      return () => {}
    }

    const layer = impellerRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const speed = deviceData?.data?.speed || 1500
    const normalizedSpeed = speed / 1500
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const rot = (frame.time * normalizedSpeed * 0.3) % 360
      impellerRef.current?.rotation(rot)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData])

  // 状态脉冲动画
  useEffect(() => {
    if (!isMonitorMode || !pulseRef.current) {
      return () => {}
    }

    const layer = pulseRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const anim = new Konva.Animation((frame) => {
      if (!frame || !pulseRef.current) return
      const scale = 1 + Math.sin(frame.time * 0.003) * 0.08
      pulseRef.current.scale({ x: scale, y: scale })
      pulseRef.current.opacity(0.25 + Math.sin(frame.time * 0.003) * 0.15)
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
    if (deviceData.data?.temperature > 80) return { main: '#fa8c16', light: '#ffc069', dark: '#d46b08' }
    return { main: '#1890ff', light: '#69c0ff', dark: '#096dd9' }
  }

  const colors = getStatusColor()
  const r = Math.min(width, height) / 2

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
          height={height + 16}
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
          radius={r + 6}
          fill={colors.main}
          opacity={0.25}
        />
      )}

      {/* 入口管道 */}
      <Group x={-r - 15} y={0}>
        <Rect
          x={0}
          y={-r * 0.2}
          width={20}
          height={r * 0.4}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: r * 0.4 }}
          fillLinearGradientColorStops={[0, '#666', 0.5, '#888', 1, '#555']}
          stroke="#444"
          strokeWidth={1}
        />
        {/* 法兰 */}
        <Rect
          x={-4}
          y={-r * 0.25}
          width={6}
          height={r * 0.5}
          fill="#555"
          stroke="#333"
          strokeWidth={1}
        />
      </Group>

      {/* 出口管道 */}
      <Group x={r - 5} y={-r * 0.6}>
        <Rect
          x={0}
          y={-10}
          width={20}
          height={r * 0.4}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: r * 0.4 }}
          fillLinearGradientColorStops={[0, '#666', 0.5, '#888', 1, '#555']}
          stroke="#444"
          strokeWidth={1}
        />
        {/* 法兰 */}
        <Rect
          x={18}
          y={-14}
          width={6}
          height={r * 0.48}
          fill="#555"
          stroke="#333"
          strokeWidth={1}
        />
      </Group>

      {/* 泵体阴影 */}
      <Ellipse
        x={2}
        y={3}
        radiusX={r}
        radiusY={r * 0.95}
        fill="#1a1a1a"
        opacity={0.3}
      />

      {/* 泵壳外层 - 3D渐变效果 */}
      <Circle
        x={0}
        y={0}
        radius={r}
        fillRadialGradientStartPoint={{ x: -r / 3, y: -r / 3 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={r}
        fillRadialGradientColorStops={[0, colors.light, 0.6, colors.main, 1, colors.dark]}
        stroke="#333"
        strokeWidth={2}
      />

      {/* 金属边框环 */}
      <Circle
        x={0}
        y={0}
        radius={r - 2}
        stroke="#555"
        strokeWidth={1}
      />

      {/* 内腔 - 蜗壳形状 */}
      <Circle
        x={0}
        y={0}
        radius={r * 0.75}
        fillLinearGradientStartPoint={{ x: 0, y: -r * 0.75 }}
        fillLinearGradientEndPoint={{ x: 0, y: r * 0.75 }}
        fillLinearGradientColorStops={[0, '#f0f0f0', 0.5, '#fff', 1, '#e0e0e0']}
        stroke="#aaa"
        strokeWidth={2}
      />

      {/* 蜗壳纹理 */}
      <Arc
        x={0}
        y={0}
        innerRadius={r * 0.5}
        outerRadius={r * 0.7}
        angle={270}
        rotation={-135}
        fill="rgba(0,0,0,0.05)"
      />

      {/* 叶轮组 */}
      <Group ref={impellerRef} x={0} y={0}>
        {/* 6个叶片 */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <Group key={angle} rotation={angle}>
            {/* 叶片 - 弧形设计 */}
            <Line
              points={[
                0, -r * 0.12,
                r * 0.12, -r * 0.45,
                r * 0.05, -r * 0.5,
                -r * 0.08, -r * 0.45,
              ]}
              closed
              fillLinearGradientStartPoint={{ x: 0, y: -r * 0.12 }}
              fillLinearGradientEndPoint={{ x: 0, y: -r * 0.5 }}
              fillLinearGradientColorStops={[0, '#4a90d9', 0.5, '#357abd', 1, '#2a5d8f']}
              stroke="#1a3d5c"
              strokeWidth={1}
            />
          </Group>
        ))}
      </Group>

      {/* 中心轴承盖 - 3D效果 */}
      <Circle
        x={0}
        y={0}
        radius={r * 0.2}
        fillRadialGradientStartPoint={{ x: -r * 0.05, y: -r * 0.05 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={r * 0.2}
        fillRadialGradientColorStops={[0, '#888', 0.5, '#666', 1, '#444']}
        stroke="#333"
        strokeWidth={1}
      />

      {/* 中心螺栓 */}
      <Circle
        x={0}
        y={0}
        radius={r * 0.08}
        fill="#555"
        stroke="#333"
        strokeWidth={1}
      />

      {/* P标记 */}
      <Text
        x={r * 0.3}
        y={r * 0.3}
        text="P"
        fontSize={r * 0.35}
        fontStyle="bold"
        fontFamily="Arial"
        fill="#333"
      />

      {/* 底座 */}
      <Rect
        x={-r * 0.5}
        y={r - 2}
        width={r}
        height={8}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: 8 }}
        fillLinearGradientColorStops={[0, '#666', 0.5, '#444', 1, '#333']}
        stroke="#222"
        strokeWidth={1}
        cornerRadius={2}
      />

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={r + 18}>
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
        <Group x={0} y={-r - 55}>
          <Rect
            x={-55}
            y={0}
            width={110}
            height={50}
            fill={hasAlarm ? 'rgba(255,77,79,0.1)' : 'rgba(24,144,255,0.08)'}
            stroke={hasAlarm ? '#ff7875' : '#91d5ff'}
            strokeWidth={1}
            cornerRadius={6}
          />
          {/* 流量 */}
          {deviceData.data.flow !== undefined && (
            <Group y={8}>
              <Text
                x={-50}
                y={0}
                text="流量"
                fontSize={10}
                fill="#8c8c8c"
              />
              <Text
                x={0}
                y={0}
                text={`${deviceData.data.flow.toFixed(1)} m³/h`}
                fontSize={11}
                fontStyle="bold"
                fill="#1890ff"
              />
            </Group>
          )}
          {/* 压力 */}
          {deviceData.data.pressure !== undefined && (
            <Group y={22}>
              <Text
                x={-50}
                y={0}
                text="压力"
                fontSize={10}
                fill="#8c8c8c"
              />
              <Text
                x={0}
                y={0}
                text={`${deviceData.data.pressure.toFixed(2)} bar`}
                fontSize={11}
                fontStyle="bold"
                fill="#1890ff"
              />
            </Group>
          )}
          {/* 温度 */}
          {deviceData.data.temperature !== undefined && (
            <Group y={36}>
              <Text
                x={-50}
                y={0}
                text="温度"
                fontSize={10}
                fill="#8c8c8c"
              />
              <Text
                x={0}
                y={0}
                text={`${deviceData.data.temperature.toFixed(1)}°C`}
                fontSize={11}
                fontStyle="bold"
                fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
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

export default Pump
