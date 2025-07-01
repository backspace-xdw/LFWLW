import React from 'react'
import { Group, Rect, Line, Text, Path } from 'react-konva'

interface ValveProps {
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

const Valve: React.FC<ValveProps> = ({
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
  // 获取开度（0-100）
  const getOpening = () => {
    if (!deviceData?.data?.opening) return 50
    return deviceData.data.opening
  }

  // 获取颜色
  const getColor = () => {
    if (!deviceData) return '#666'
    if (deviceData.status === 'offline') return '#999'
    if (hasAlarm) return '#ff4d4f'
    const opening = getOpening()
    if (opening === 0) return '#ff4d4f' // 全关
    if (opening === 100) return '#52c41a' // 全开
    return '#1890ff' // 部分开启
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

      {/* 管道 */}
      <Line
        points={[-width / 2, 0, width / 2, 0]}
        stroke="#666"
        strokeWidth={4}
      />

      {/* 阀体 */}
      <Path
        data={`
          M ${-width / 4} ${-height / 2}
          L ${width / 4} ${-height / 2}
          L ${width / 4} ${height / 2}
          L ${-width / 4} ${height / 2}
          Z
        `}
        fill={getColor()}
        stroke="#333"
        strokeWidth={2}
      />

      {/* 阀杆（根据开度旋转） */}
      <Line
        points={[0, -height / 2, 0, height / 2]}
        stroke="#333"
        strokeWidth={3}
        rotation={90 - (getOpening() * 0.9)} // 0度=关，90度=开
      />

      {/* 标签 */}
      {showLabel && (
        <Group x={0} y={height / 2 + 15}>
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
            text={`${getOpening()}%`}
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
          x={width / 2 - 6}
          y={-height / 2 - 6}
          width={12}
          height={12}
          fill="#ff4d4f"
          stroke="#fff"
          strokeWidth={2}
          cornerRadius={6}
        />
      )}
    </Group>
  )
}

export default Valve