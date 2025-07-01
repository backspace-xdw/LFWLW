import React from 'react'
import { Group, Rect, Text, Line, Path } from 'react-konva'

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
  // 获取液位（0-100）
  const getLevel = () => {
    if (!deviceData?.data?.level) return 0
    return Math.min(100, Math.max(0, deviceData.data.level))
  }

  // 获取颜色
  const getColor = () => {
    if (!deviceData) return '#e6f7ff'
    const level = getLevel()
    if (level < 20) return '#fff1f0' // 低液位
    if (level > 90) return '#fffbe6' // 高液位
    return '#e6f7ff' // 正常
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

  const level = getLevel()
  const liquidHeight = (height - 20) * (level / 100)

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
          x={-width / 2 - 5}
          y={-height / 2 - 5}
          width={width + 10}
          height={height + 10}
          stroke="#1890ff"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}

      {/* 储罐外壳 */}
      <Path
        data={`
          M ${-width / 2} ${-height / 2 + 10}
          Q ${-width / 2} ${-height / 2}, ${-width / 2 + 10} ${-height / 2}
          L ${width / 2 - 10} ${-height / 2}
          Q ${width / 2} ${-height / 2}, ${width / 2} ${-height / 2 + 10}
          L ${width / 2} ${height / 2 - 10}
          Q ${width / 2} ${height / 2}, ${width / 2 - 10} ${height / 2}
          L ${-width / 2 + 10} ${height / 2}
          Q ${-width / 2} ${height / 2}, ${-width / 2} ${height / 2 - 10}
          Z
        `}
        fill={getColor()}
        stroke="#333"
        strokeWidth={2}
      />

      {/* 液体 */}
      {level > 0 && (
        <Rect
          x={-width / 2 + 5}
          y={height / 2 - 5 - liquidHeight}
          width={width - 10}
          height={liquidHeight}
          fill="#1890ff"
          opacity={0.6}
          cornerRadius={[0, 0, 5, 5]}
        />
      )}

      {/* 液位刻度 */}
      {[0, 25, 50, 75, 100].map((mark) => (
        <Line
          key={mark}
          points={[
            -width / 2 - 5,
            height / 2 - 5 - (height - 20) * (mark / 100),
            -width / 2 + 5,
            height / 2 - 5 - (height - 20) * (mark / 100),
          ]}
          stroke="#666"
          strokeWidth={1}
        />
      ))}

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={height / 2 + 15}>
          <Rect
            x={-35}
            y={-10}
            width={70}
            height={20}
            fill="white"
            stroke="#ddd"
            strokeWidth={1}
            cornerRadius={2}
          />
          <Text
            x={-35}
            y={-10}
            width={70}
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
        <Group x={0} y={0}>
          <Rect
            x={-30}
            y={-15}
            width={60}
            height={30}
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#ddd"
            strokeWidth={1}
            cornerRadius={2}
          />
          <Text
            x={-30}
            y={-15}
            width={60}
            height={30}
            text={`${level.toFixed(0)}%`}
            fontSize={20}
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            fill={level < 20 || level > 90 ? '#ff4d4f' : '#333'}
          />
        </Group>
      )}

      {/* 温度显示 */}
      {isMonitorMode && deviceData?.data?.temperature && (
        <Group x={0} y={-height / 2 - 25}>
          <Rect
            x={-35}
            y={-10}
            width={70}
            height={20}
            fill={hasAlarm ? '#fff1f0' : '#f0f9ff'}
            stroke={hasAlarm ? '#ffccc7' : '#bae7ff'}
            strokeWidth={1}
            cornerRadius={2}
          />
          <Text
            x={-35}
            y={-10}
            width={70}
            height={20}
            text={`${deviceData.data.temperature.toFixed(1)}°C`}
            fontSize={12}
            align="center"
            verticalAlign="middle"
            fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
          />
        </Group>
      )}

      {/* 告警指示器 */}
      {hasAlarm && (
        <Rect
          x={width / 2 - 8}
          y={-height / 2 - 8}
          width={16}
          height={16}
          fill="#ff4d4f"
          stroke="#fff"
          strokeWidth={2}
          cornerRadius={8}
        />
      )}
    </Group>
  )
}

export default Tank