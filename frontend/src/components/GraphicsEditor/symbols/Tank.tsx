import React, { useEffect, useRef } from 'react'
import { Group, Rect, Text, Line, Circle, Ellipse } from 'react-konva'
import Konva from 'konva'

interface TankProps {
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

const Tank: React.FC<TankProps> = ({
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
  const liquidRef = useRef<Konva.Rect>(null)
  const pulseRef = useRef<Konva.Circle>(null)

  // 获取液位（0-100）
  const getLevel = () => {
    if (!deviceData?.data?.level) return 0
    return Math.min(100, Math.max(0, deviceData.data.level))
  }

  // 液位波动动画
  useEffect(() => {
    if (!isMonitorMode || !liquidRef.current || getLevel() === 0) {
      return () => {}
    }

    const layer = liquidRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const baseHeight = (height - 30) * (getLevel() / 100)
    const anim = new Konva.Animation((frame) => {
      if (!frame || !liquidRef.current) return
      const wave = Math.sin(frame.time * 0.002) * 2
      liquidRef.current.height(baseHeight + wave)
      liquidRef.current.y(height / 2 - 8 - baseHeight - wave)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData?.data?.level, height])

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
      pulseRef.current.opacity(0.15 + Math.sin(frame.time * 0.003) * 0.1)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, deviceData?.status])

  // 获取液位颜色
  const getLevelColor = () => {
    const level = getLevel()
    if (level < 20) return { main: '#ff4d4f', light: '#ff7875', dark: '#cf1322' }
    if (level > 90) return { main: '#faad14', light: '#ffc53d', dark: '#d48806' }
    return { main: '#1890ff', light: '#69c0ff', dark: '#096dd9' }
  }

  // 获取罐体颜色
  const getTankColor = () => {
    if (!deviceData) return { main: '#e8e8e8', light: '#f5f5f5', dark: '#d9d9d9' }
    if (deviceData.status === 'offline') return { main: '#bfbfbf', light: '#d9d9d9', dark: '#8c8c8c' }
    if (hasAlarm) return { main: '#fff1f0', light: '#fff7e6', dark: '#ffccc7' }
    return { main: '#e8e8e8', light: '#f5f5f5', dark: '#d9d9d9' }
  }

  const level = getLevel()
  const liquidHeight = (height - 30) * (level / 100)
  const levelColors = getLevelColor()
  const tankColors = getTankColor()
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
      draggable={!isMonitorMode}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
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
          fill={levelColors.main}
          opacity={0.15}
        />
      )}

      {/* 储罐阴影 */}
      <Rect
        x={-w / 2 + 4}
        y={-h / 2 + 4}
        width={w}
        height={h}
        fill="#1a1a1a"
        opacity={0.2}
        cornerRadius={8}
      />

      {/* 储罐主体 - 3D效果 */}
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fillLinearGradientStartPoint={{ x: -w / 2, y: 0 }}
        fillLinearGradientEndPoint={{ x: w / 2, y: 0 }}
        fillLinearGradientColorStops={[0, tankColors.dark, 0.2, tankColors.light, 0.5, tankColors.main, 0.8, tankColors.light, 1, tankColors.dark]}
        stroke="#666"
        strokeWidth={2}
        cornerRadius={8}
      />

      {/* 顶部封头 - 椭圆效果 */}
      <Ellipse
        x={0}
        y={-h / 2}
        radiusX={w / 2 - 1}
        radiusY={12}
        fillLinearGradientStartPoint={{ x: 0, y: -12 }}
        fillLinearGradientEndPoint={{ x: 0, y: 12 }}
        fillLinearGradientColorStops={[0, '#999', 0.3, '#ccc', 0.7, '#aaa', 1, '#888']}
        stroke="#666"
        strokeWidth={1}
      />

      {/* 底部封头 */}
      <Ellipse
        x={0}
        y={h / 2}
        radiusX={w / 2 - 1}
        radiusY={8}
        fillLinearGradientStartPoint={{ x: 0, y: -8 }}
        fillLinearGradientEndPoint={{ x: 0, y: 8 }}
        fillLinearGradientColorStops={[0, '#888', 0.5, '#aaa', 1, '#777']}
        stroke="#666"
        strokeWidth={1}
      />

      {/* 液体 */}
      {level > 0 && (
        <Rect
          ref={liquidRef}
          x={-w / 2 + 6}
          y={h / 2 - 8 - liquidHeight}
          width={w - 12}
          height={liquidHeight}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: liquidHeight }}
          fillLinearGradientColorStops={[0, levelColors.light, 0.5, levelColors.main, 1, levelColors.dark]}
          opacity={0.8}
          cornerRadius={[0, 0, 4, 4]}
        />
      )}

      {/* 液面波纹效果 */}
      {level > 0 && level < 100 && (
        <Line
          points={[
            -w / 2 + 8, h / 2 - 8 - liquidHeight,
            -w / 4, h / 2 - 8 - liquidHeight - 2,
            0, h / 2 - 8 - liquidHeight + 1,
            w / 4, h / 2 - 8 - liquidHeight - 1,
            w / 2 - 8, h / 2 - 8 - liquidHeight,
          ]}
          stroke={levelColors.light}
          strokeWidth={2}
          opacity={0.6}
          tension={0.5}
        />
      )}

      {/* 液位刻度尺 */}
      <Group x={-w / 2 - 12} y={0}>
        {/* 刻度背景 */}
        <Rect
          x={0}
          y={-h / 2 + 12}
          width={8}
          height={h - 24}
          fill="rgba(255,255,255,0.8)"
          stroke="#999"
          strokeWidth={1}
          cornerRadius={2}
        />
        {/* 刻度线 */}
        {[0, 25, 50, 75, 100].map((mark) => (
          <Group key={mark}>
            <Line
              points={[
                0, h / 2 - 12 - (h - 24) * (mark / 100),
                10, h / 2 - 12 - (h - 24) * (mark / 100),
              ]}
              stroke="#666"
              strokeWidth={mark % 50 === 0 ? 2 : 1}
            />
            {mark % 50 === 0 && (
              <Text
                x={-20}
                y={h / 2 - 12 - (h - 24) * (mark / 100) - 5}
                text={`${mark}`}
                fontSize={8}
                fill="#666"
                align="right"
                width={18}
              />
            )}
          </Group>
        ))}
        {/* 当前液位指示 */}
        <Line
          points={[
            -5, h / 2 - 12 - (h - 24) * (level / 100),
            12, h / 2 - 12 - (h - 24) * (level / 100),
          ]}
          stroke={levelColors.main}
          strokeWidth={3}
        />
      </Group>

      {/* 顶部进料口 */}
      <Group x={0} y={-h / 2 - 8}>
        <Rect
          x={-8}
          y={-12}
          width={16}
          height={14}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 16, y: 0 }}
          fillLinearGradientColorStops={[0, '#666', 0.5, '#888', 1, '#555']}
          stroke="#444"
          strokeWidth={1}
          cornerRadius={[2, 2, 0, 0]}
        />
        {/* 法兰 */}
        <Rect
          x={-12}
          y={-14}
          width={24}
          height={4}
          fill="#555"
          stroke="#333"
          strokeWidth={1}
        />
      </Group>

      {/* 底部出料口 */}
      <Group x={0} y={h / 2 + 2}>
        <Rect
          x={-6}
          y={0}
          width={12}
          height={10}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 12, y: 0 }}
          fillLinearGradientColorStops={[0, '#666', 0.5, '#888', 1, '#555']}
          stroke="#444"
          strokeWidth={1}
          cornerRadius={[0, 0, 2, 2]}
        />
      </Group>

      {/* T标记 */}
      <Text
        x={w / 2 - 25}
        y={-h / 2 + 20}
        text="T"
        fontSize={Math.min(w, h) * 0.2}
        fontStyle="bold"
        fontFamily="Arial"
        fill="#666"
      />

      {/* 中心液位显示 */}
      {isMonitorMode && (
        <Group x={0} y={0}>
          <Rect
            x={-30}
            y={-20}
            width={60}
            height={40}
            fill="rgba(255, 255, 255, 0.95)"
            stroke={level < 20 || level > 90 ? '#ff7875' : '#d9d9d9'}
            strokeWidth={level < 20 || level > 90 ? 2 : 1}
            cornerRadius={6}
            shadowColor="#000"
            shadowBlur={4}
            shadowOpacity={0.1}
            shadowOffsetY={2}
          />
          <Text
            x={-30}
            y={-18}
            width={60}
            height={20}
            text={`${level.toFixed(0)}%`}
            fontSize={18}
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            fill={level < 20 ? '#ff4d4f' : level > 90 ? '#faad14' : '#1890ff'}
          />
          <Text
            x={-30}
            y={4}
            width={60}
            height={14}
            text={level < 20 ? '低液位' : level > 90 ? '高液位' : '正常'}
            fontSize={10}
            align="center"
            verticalAlign="middle"
            fill={level < 20 ? '#ff4d4f' : level > 90 ? '#faad14' : '#52c41a'}
          />
        </Group>
      )}

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={h / 2 + 22}>
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
        <Group x={w / 2 + 15} y={-h / 4}>
          <Rect
            x={0}
            y={0}
            width={70}
            height={50}
            fill={hasAlarm ? 'rgba(255,77,79,0.1)' : 'rgba(24,144,255,0.08)'}
            stroke={hasAlarm ? '#ff7875' : '#91d5ff'}
            strokeWidth={1}
            cornerRadius={6}
          />
          {/* 温度 */}
          {deviceData.data.temperature !== undefined && (
            <Group y={10}>
              <Text
                x={5}
                y={0}
                text="温度"
                fontSize={9}
                fill="#8c8c8c"
              />
              <Text
                x={5}
                y={12}
                text={`${deviceData.data.temperature.toFixed(1)}°C`}
                fontSize={11}
                fontStyle="bold"
                fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
              />
            </Group>
          )}
          {/* 压力 */}
          {deviceData.data.pressure !== undefined && (
            <Group y={32}>
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

export default Tank
