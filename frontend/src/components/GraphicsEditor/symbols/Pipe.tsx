import React, { useEffect, useRef } from 'react'
import { Group, Line, Arrow, Circle, Rect } from 'react-konva'
import Konva from 'konva'

interface PipeProps {
  id: string
  points: number[]
  stroke?: string
  strokeWidth?: number
  hasFlow?: boolean
  flowDirection?: 'forward' | 'backward'
  flowSpeed?: number
  pipeType?: 'normal' | 'insulated' | 'heated' | 'cooling'
  isMonitorMode?: boolean
  isSelected?: boolean
  deviceData?: any
  onSelect?: () => void
  onChange?: (attrs: any) => void
}

const Pipe: React.FC<PipeProps> = ({
  id: _id,
  points,
  stroke: _stroke = '#666',
  strokeWidth = 8,
  hasFlow = false,
  flowDirection = 'forward',
  flowSpeed = 1,
  pipeType = 'normal',
  isMonitorMode = false,
  isSelected = false,
  deviceData,
  onSelect,
  onChange,
}) => {
  const flowRef = useRef<Konva.Line>(null)
  const particlesRef = useRef<Konva.Group>(null)

  // 流动动画
  useEffect(() => {
    if (!isMonitorMode || !hasFlow || !flowRef.current) {
      return () => {}
    }

    const layer = flowRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const speed = flowSpeed * (flowDirection === 'backward' ? -1 : 1)
    const anim = new Konva.Animation((frame) => {
      if (!frame || !flowRef.current) return
      const offset = (frame.time * speed * 0.05) % 30
      flowRef.current.dashOffset(-offset)
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, hasFlow, flowDirection, flowSpeed])

  // 粒子流动动画
  useEffect(() => {
    if (!isMonitorMode || !hasFlow || !particlesRef.current || points.length < 4) {
      return () => {}
    }

    const layer = particlesRef.current.getLayer()
    if (!layer) {
      return () => {}
    }

    const particles = particlesRef.current.children
    const speed = flowSpeed * 0.001 * (flowDirection === 'backward' ? -1 : 1)

    const anim = new Konva.Animation((frame) => {
      if (!frame || !particles) return

      particles.forEach((particle, index) => {
        const progress = ((frame.time * speed + index * 0.25) % 1 + 1) % 1
        const totalLength = calculatePathLength(points)
        const targetDistance = progress * totalLength

        const position = getPointAtDistance(points, targetDistance)
        if (position) {
          particle.x(position.x)
          particle.y(position.y)
          particle.opacity(0.4 + Math.sin(frame.time * 0.01 + index) * 0.3)
        }
      })
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [isMonitorMode, hasFlow, flowDirection, flowSpeed, points])

  // 计算路径总长度
  const calculatePathLength = (pts: number[]): number => {
    let length = 0
    for (let i = 0; i < pts.length - 2; i += 2) {
      const dx = pts[i + 2] - pts[i]
      const dy = pts[i + 3] - pts[i + 1]
      length += Math.sqrt(dx * dx + dy * dy)
    }
    return length
  }

  // 获取路径上指定距离的点
  const getPointAtDistance = (pts: number[], distance: number): { x: number; y: number } | null => {
    let currentDistance = 0
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x1 = pts[i]
      const y1 = pts[i + 1]
      const x2 = pts[i + 2]
      const y2 = pts[i + 3]
      const dx = x2 - x1
      const dy = y2 - y1
      const segmentLength = Math.sqrt(dx * dx + dy * dy)

      if (currentDistance + segmentLength >= distance) {
        const ratio = (distance - currentDistance) / segmentLength
        return {
          x: x1 + dx * ratio,
          y: y1 + dy * ratio,
        }
      }
      currentDistance += segmentLength
    }
    return pts.length >= 2 ? { x: pts[pts.length - 2], y: pts[pts.length - 1] } : null
  }

  // 获取管道颜色
  const getPipeColor = () => {
    switch (pipeType) {
      case 'insulated':
        return { main: '#8c8c8c', light: '#bfbfbf', dark: '#595959', accent: '#faad14' }
      case 'heated':
        return { main: '#ff7a45', light: '#ffa940', dark: '#d4380d', accent: '#ff4d4f' }
      case 'cooling':
        return { main: '#36cfc9', light: '#5cdbd3', dark: '#13a8a8', accent: '#1890ff' }
      default:
        return { main: '#666', light: '#999', dark: '#444', accent: '#1890ff' }
    }
  }

  // 获取流体颜色
  const getFluidColor = () => {
    if (deviceData?.fluidType === 'water') return '#1890ff'
    if (deviceData?.fluidType === 'steam') return '#fff'
    if (deviceData?.fluidType === 'oil') return '#d48806'
    if (deviceData?.fluidType === 'gas') return '#52c41a'
    return '#69c0ff'
  }

  const colors = getPipeColor()
  const fluidColor = getFluidColor()

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

  // 如果点数不够，返回空
  if (points.length < 4) {
    return null
  }

  return (
    <Group>
      {/* 管道阴影 */}
      <Line
        points={points.map((p, i) => i % 2 === 0 ? p + 2 : p + 2)}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={strokeWidth + 4}
        lineCap="round"
        lineJoin="round"
      />

      {/* 管道外壁 - 3D效果 */}
      <Line
        points={points}
        stroke={colors.dark}
        strokeWidth={strokeWidth + 4}
        lineCap="round"
        lineJoin="round"
      />

      {/* 管道主体 */}
      <Line
        points={points}
        stroke={colors.main}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
      />

      {/* 管道高光 */}
      <Line
        points={points}
        stroke={colors.light}
        strokeWidth={strokeWidth * 0.4}
        lineCap="round"
        lineJoin="round"
        opacity={0.5}
      />

      {/* 流动指示 - 虚线 */}
      {hasFlow && isMonitorMode && (
        <Line
          ref={flowRef}
          points={points}
          stroke={fluidColor}
          strokeWidth={strokeWidth * 0.5}
          lineCap="round"
          lineJoin="round"
          dash={[15, 15]}
          opacity={0.8}
        />
      )}

      {/* 流动粒子 */}
      {hasFlow && isMonitorMode && (
        <Group ref={particlesRef}>
          {[0, 1, 2, 3].map((i) => (
            <Circle
              key={i}
              x={points[0]}
              y={points[1]}
              radius={strokeWidth * 0.3}
              fill={fluidColor}
              opacity={0.6}
              shadowColor={fluidColor}
              shadowBlur={4}
              shadowOpacity={0.5}
            />
          ))}
        </Group>
      )}

      {/* 流向箭头 */}
      {hasFlow && points.length >= 4 && (
        <Arrow
          points={flowDirection === 'forward' ? points : [...points].reverse()}
          stroke="transparent"
          strokeWidth={0}
          fill={fluidColor}
          pointerLength={12}
          pointerWidth={10}
          pointerAtBeginning={false}
          pointerAtEnding={true}
          opacity={0.9}
        />
      )}

      {/* 选中高亮 */}
      {isSelected && (
        <Line
          points={points}
          stroke="#1890ff"
          strokeWidth={strokeWidth + 8}
          lineCap="round"
          lineJoin="round"
          dash={[10, 5]}
          opacity={0.5}
        />
      )}

      {/* 绝缘层标记 */}
      {pipeType === 'insulated' && (
        <>
          {points.length >= 4 && Array.from({ length: Math.floor(calculatePathLength(points) / 40) }).map((_, i) => {
            const pos = getPointAtDistance(points, i * 40 + 20)
            if (!pos) return null
            return (
              <Rect
                key={i}
                x={pos.x - 3}
                y={pos.y - strokeWidth / 2 - 4}
                width={6}
                height={strokeWidth + 8}
                fill={colors.accent}
                opacity={0.6}
                cornerRadius={1}
              />
            )
          })}
        </>
      )}

      {/* 加热管标记 */}
      {pipeType === 'heated' && (
        <>
          {points.length >= 4 && Array.from({ length: Math.floor(calculatePathLength(points) / 30) }).map((_, i) => {
            const pos = getPointAtDistance(points, i * 30 + 15)
            if (!pos) return null
            return (
              <Circle
                key={i}
                x={pos.x}
                y={pos.y}
                radius={3}
                fill={colors.accent}
                shadowColor={colors.accent}
                shadowBlur={5}
                shadowOpacity={0.6}
              />
            )
          })}
        </>
      )}

      {/* 冷却管标记 */}
      {pipeType === 'cooling' && (
        <>
          {points.length >= 4 && Array.from({ length: Math.floor(calculatePathLength(points) / 35) }).map((_, i) => {
            const pos = getPointAtDistance(points, i * 35 + 17)
            if (!pos) return null
            return (
              <Group key={i} x={pos.x} y={pos.y}>
                <Line
                  points={[-4, -4, 4, 4]}
                  stroke={colors.accent}
                  strokeWidth={2}
                  opacity={0.8}
                />
                <Line
                  points={[4, -4, -4, 4]}
                  stroke={colors.accent}
                  strokeWidth={2}
                  opacity={0.8}
                />
              </Group>
            )
          })}
        </>
      )}

      {/* 起点连接点 */}
      <Group x={points[0]} y={points[1]}>
        <Circle
          x={0}
          y={0}
          radius={strokeWidth / 2 + 3}
          fillRadialGradientStartPoint={{ x: -2, y: -2 }}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={strokeWidth / 2 + 3}
          fillRadialGradientColorStops={[0, '#999', 0.5, '#777', 1, '#555']}
          stroke="#444"
          strokeWidth={1}
        />
        <Circle
          x={0}
          y={0}
          radius={strokeWidth / 4}
          fill="#333"
        />
      </Group>

      {/* 终点连接点 */}
      <Group x={points[points.length - 2]} y={points[points.length - 1]}>
        <Circle
          x={0}
          y={0}
          radius={strokeWidth / 2 + 3}
          fillRadialGradientStartPoint={{ x: -2, y: -2 }}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={strokeWidth / 2 + 3}
          fillRadialGradientColorStops={[0, '#999', 0.5, '#777', 1, '#555']}
          stroke="#444"
          strokeWidth={1}
        />
        <Circle
          x={0}
          y={0}
          radius={strokeWidth / 4}
          fill="#333"
        />
      </Group>

      {/* 中间连接点（拐点） */}
      {points.length > 4 && (
        <>
          {Array.from({ length: (points.length - 4) / 2 }).map((_, i) => {
            const idx = (i + 1) * 2
            return (
              <Circle
                key={idx}
                x={points[idx]}
                y={points[idx + 1]}
                radius={strokeWidth / 2 + 2}
                fillRadialGradientStartPoint={{ x: -1, y: -1 }}
                fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndRadius={strokeWidth / 2 + 2}
                fillRadialGradientColorStops={[0, '#888', 0.5, '#666', 1, '#444']}
                stroke="#333"
                strokeWidth={1}
              />
            )
          })}
        </>
      )}

      {/* 流量数据显示 */}
      {isMonitorMode && hasFlow && deviceData?.data?.flow !== undefined && (
        <Group x={(points[0] + points[points.length - 2]) / 2} y={(points[1] + points[points.length - 1]) / 2 - 20}>
          <Rect
            x={-35}
            y={-10}
            width={70}
            height={20}
            fill="rgba(24,144,255,0.1)"
            stroke="#91d5ff"
            strokeWidth={1}
            cornerRadius={4}
          />
          <Circle
            x={-25}
            y={0}
            radius={4}
            fill={fluidColor}
          />
          <Line
            points={[-22, 0, -18, 0]}
            stroke={fluidColor}
            strokeWidth={2}
          />
          <Line
            points={[-20, -2, -18, 0, -20, 2]}
            stroke={fluidColor}
            strokeWidth={1.5}
            lineCap="round"
            lineJoin="round"
          />
          <Rect
            x={-10}
            y={-8}
            width={40}
            height={16}
            fill="transparent"
          />
          <Line
            points={[-10, 0, -10, 0]}
            stroke="transparent"
          />
          {/* 在这里使用 Konva Text 但由于复杂度，简化处理 */}
        </Group>
      )}
    </Group>
  )
}

export default Pipe
