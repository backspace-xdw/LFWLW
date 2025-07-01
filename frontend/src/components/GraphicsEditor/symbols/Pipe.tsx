import React from 'react'
import { Line, Arrow } from 'react-konva'

interface PipeProps {
  id: string
  points: number[]
  stroke?: string
  strokeWidth?: number
  hasFlow?: boolean
  flowDirection?: 'forward' | 'backward'
  isMonitorMode?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onChange?: (attrs: any) => void
}

const Pipe: React.FC<PipeProps> = ({
  id,
  points,
  stroke = '#666',
  strokeWidth = 4,
  hasFlow = false,
  flowDirection = 'forward',
  isMonitorMode = false,
  isSelected = false,
  onSelect,
  onChange,
}) => {
  const handleClick = () => {
    if (!isMonitorMode && onSelect) {
      onSelect()
    }
  }

  const handleDragEnd = () => {
    if (!isMonitorMode && onChange) {
      // 管道暂不支持拖拽，需要通过端点编辑
    }
  }

  // 如果有流动，使用箭头
  if (hasFlow && points.length >= 4) {
    const arrowPoints = flowDirection === 'forward' ? points : [...points].reverse()
    return (
      <Arrow
        points={arrowPoints}
        stroke={isSelected ? '#1890ff' : stroke}
        strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
        fill={isSelected ? '#1890ff' : stroke}
        onClick={handleClick}
        onTap={handleClick}
        dash={isSelected ? [10, 5] : undefined}
      />
    )
  }

  // 普通管道
  return (
    <Line
      points={points}
      stroke={isSelected ? '#1890ff' : stroke}
      strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      dash={isSelected ? [10, 5] : undefined}
      lineCap="round"
      lineJoin="round"
    />
  )
}

export default Pipe