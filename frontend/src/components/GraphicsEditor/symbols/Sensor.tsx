import React from 'react'
import { Group, Circle, Rect, Text, Line } from 'react-konva'

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
  onSelect,
  onChange,
}) => {
  // 获取颜色
  const getColor = () => {
    if (!deviceData) return '#666'
    if (deviceData.status === 'offline') return '#999'
    if (hasAlarm) return '#ff4d4f'
    return '#52c41a'
  }

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

  const radius = Math.min(width, height) / 2

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
          x={-radius - 5}
          y={-radius - 5}
          width={radius * 2 + 10}
          height={radius * 2 + 10}
          stroke="#1890ff"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}

      {/* 传感器外圈 */}
      <Circle
        x={0}
        y={0}
        radius={radius}
        fill="white"
        stroke={getColor()}
        strokeWidth={3}
      />

      {/* 传感器内圈 */}
      <Circle
        x={0}
        y={0}
        radius={radius * 0.6}
        fill={getColor()}
      />

      {/* 传感器符号 */}
      <Text
        x={-radius * 0.5}
        y={-radius * 0.3}
        width={radius}
        height={radius * 0.6}
        text="S"
        fontSize={radius * 0.8}
        fontStyle="bold"
        fill="white"
        align="center"
        verticalAlign="middle"
      />

      {/* 连接线 */}
      <Line
        points={[0, radius, 0, radius + 10]}
        stroke="#666"
        strokeWidth={2}
      />

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={radius + 25}>
          <Rect
            x={-30}
            y={-10}
            width={60}
            height={20}
            fill="white"
            stroke="#ddd"
            strokeWidth={1}
            cornerRadius={2}
          />
          <Text
            x={-30}
            y={-10}
            width={60}
            height={20}
            text={deviceId || id}
            fontSize={12}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}

      {/* 数据显示 */}
      {isMonitorMode && deviceData?.data && (
        <Group x={radius + 15} y={0}>
          {deviceData.data.temperature !== undefined && (
            <Group y={-10}>
              <Rect
                x={0}
                y={-8}
                width={50}
                height={16}
                fill={hasAlarm ? '#fff1f0' : '#f0f9ff'}
                stroke={hasAlarm ? '#ffccc7' : '#bae7ff'}
                strokeWidth={1}
                cornerRadius={2}
              />
              <Text
                x={0}
                y={-8}
                width={50}
                height={16}
                text={`${deviceData.data.temperature.toFixed(1)}°C`}
                fontSize={11}
                align="center"
                verticalAlign="middle"
                fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
              />
            </Group>
          )}
          {deviceData.data.humidity !== undefined && (
            <Group y={10}>
              <Rect
                x={0}
                y={-8}
                width={50}
                height={16}
                fill="#f0f9ff"
                stroke="#bae7ff"
                strokeWidth={1}
                cornerRadius={2}
              />
              <Text
                x={0}
                y={-8}
                width={50}
                height={16}
                text={`${deviceData.data.humidity.toFixed(0)}%`}
                fontSize={11}
                align="center"
                verticalAlign="middle"
                fill="#1890ff"
              />
            </Group>
          )}
        </Group>
      )}

      {/* 告警指示器 */}
      {hasAlarm && (
        <Circle
          x={radius * 0.7}
          y={-radius * 0.7}
          radius={5}
          fill="#ff4d4f"
          stroke="#fff"
          strokeWidth={2}
        />
      )}
    </Group>
  )
}

export default Sensor