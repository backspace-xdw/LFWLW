import React, { useEffect, useRef } from 'react'
import { Group, Circle, Rect, Text, Line } from 'react-konva'
import Konva from 'konva'

interface MotorProps {
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

const Motor: React.FC<MotorProps> = ({
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
  const fanRef = useRef<Konva.Group>(null)

  // 风扇旋转动画
  useEffect(() => {
    if (isMonitorMode && deviceData?.status === 'online' && fanRef.current) {
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
      return () => anim.stop()
    }
  }, [isMonitorMode, deviceData])

  // 获取颜色
  const getColor = () => {
    if (!deviceData) return '#666'
    if (deviceData.status === 'offline') return '#999'
    if (hasAlarm) return '#ff4d4f'
    if (deviceData.data?.temperature > 85) return '#fa8c16'
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

      {/* 电机主体 */}
      <Circle
        x={0}
        y={0}
        radius={width / 2}
        fill={getColor()}
        stroke="#333"
        strokeWidth={2}
      />

      {/* 电机定子 */}
      <Circle
        x={0}
        y={0}
        radius={width / 2.5}
        fill="#fff"
        stroke="#333"
        strokeWidth={1}
      />

      {/* 风扇叶片 */}
      <Group ref={fanRef} x={0} y={0}>
        {[0, 120, 240].map((angle) => (
          <Line
            key={angle}
            points={[0, 0, 0, -width / 3]}
            stroke="#333"
            strokeWidth={3}
            rotation={angle}
            lineCap="round"
          />
        ))}
      </Group>

      {/* 中心轴 */}
      <Circle
        x={0}
        y={0}
        radius={width / 10}
        fill="#333"
      />

      {/* M标记 */}
      <Text
        x={-width / 4}
        y={width / 4}
        text="M"
        fontSize={width / 4}
        fontStyle="bold"
        fill="#333"
      />

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
        <Group x={0} y={-height / 2 - 40}>
          {/* 温度 */}
          {deviceData.data.temperature !== undefined && (
            <Group y={0}>
              <Rect
                x={-35}
                y={-8}
                width={70}
                height={16}
                fill={hasAlarm ? '#fff1f0' : '#f0f9ff'}
                stroke={hasAlarm ? '#ffccc7' : '#bae7ff'}
                strokeWidth={1}
                cornerRadius={2}
              />
              <Text
                x={-35}
                y={-8}
                width={70}
                height={16}
                text={`${deviceData.data.temperature.toFixed(1)}°C`}
                fontSize={11}
                align="center"
                verticalAlign="middle"
                fill={hasAlarm ? '#ff4d4f' : '#1890ff'}
              />
            </Group>
          )}
          {/* 转速 */}
          {deviceData.data.rpm !== undefined && (
            <Group y={18}>
              <Rect
                x={-35}
                y={-8}
                width={70}
                height={16}
                fill="#f0f9ff"
                stroke="#bae7ff"
                strokeWidth={1}
                cornerRadius={2}
              />
              <Text
                x={-35}
                y={-8}
                width={70}
                height={16}
                text={`${deviceData.data.rpm} rpm`}
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

export default Motor