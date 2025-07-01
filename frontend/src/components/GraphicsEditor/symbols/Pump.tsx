import React, { useEffect, useRef } from 'react'
import { Group, Circle, Path, Text, Rect } from 'react-konva'
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
  const groupRef = useRef<Konva.Group>(null)

  // 旋转动画
  useEffect(() => {
    if (isMonitorMode && deviceData?.status === 'online' && groupRef.current) {
      const layer = groupRef.current.getLayer()
      if (!layer) return
      
      const anim = new Konva.Animation((frame) => {
        if (!frame) return
        const rot = (frame.time * 0.1) % 360
        groupRef.current?.rotation(rot)
      }, layer)
      
      anim.start()
      return () => anim.stop()
    }
  }, [isMonitorMode, deviceData])

  // 获取颜色
  const getColor = () => {
    if (!deviceData) return '#666'
    if (deviceData.status === 'offline') return '#999'
    if (hasAlarm) return '#ff4d4f'
    if (deviceData.data?.temperature > 80) return '#fa8c16'
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

  return (
    <Group
      ref={groupRef}
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

      {/* 泵体 */}
      <Circle
        x={0}
        y={0}
        radius={width / 2}
        fill={getColor()}
        stroke="#333"
        strokeWidth={2}
      />

      {/* 泵叶片 */}
      <Path
        data={`
          M ${-width / 4} ${-height / 4}
          L ${width / 4} ${-height / 4}
          L ${width / 4} ${height / 4}
          L ${-width / 4} ${height / 4}
          Z
        `}
        fill="#fff"
        stroke="#333"
        strokeWidth={1}
        opacity={0.8}
      />

      {/* 中心点 */}
      <Circle
        x={0}
        y={0}
        radius={width / 8}
        fill="#333"
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
            x={-40}
            y={-10}
            width={80}
            height={20}
            fill={hasAlarm ? '#fff1f0' : '#f0f9ff'}
            stroke={hasAlarm ? '#ffccc7' : '#bae7ff'}
            strokeWidth={1}
            cornerRadius={2}
          />
          <Text
            x={-40}
            y={-10}
            width={80}
            height={20}
            text={`${deviceData.data.temperature?.toFixed(1)}°C`}
            fontSize={12}
            align="center"
            verticalAlign="middle"
            fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
          />
        </Group>
      )}

      {/* 告警指示器 */}
      {hasAlarm && (
        <Circle
          x={width / 2}
          y={-height / 2}
          radius={6}
          fill="#ff4d4f"
          stroke="#fff"
          strokeWidth={2}
        />
      )}
    </Group>
  )
}

export default Pump