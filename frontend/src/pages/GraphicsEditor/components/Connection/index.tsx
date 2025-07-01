import React from 'react';
import { Line, Circle, Arrow, Group } from 'react-konva';
import { Connection as ConnectionType } from '../../types';

interface ConnectionProps {
  connection: ConnectionType;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const Connection: React.FC<ConnectionProps> = ({
  connection,
  isSelected,
  onSelect,
  onDelete,
}) => {
  // 计算正交路径
  const calculateOrthogonalPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return [];

    const path: number[] = [];
    const start = points[0];
    const end = points[points.length - 1];

    // 简单的正交路径算法
    path.push(start.x, start.y);

    if (points.length === 2) {
      // 直接连接的情况，创建正交路径
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        // 水平方向为主
        const midX = start.x + dx / 2;
        path.push(midX, start.y);
        path.push(midX, end.y);
      } else {
        // 垂直方向为主
        const midY = start.y + dy / 2;
        path.push(start.x, midY);
        path.push(end.x, midY);
      }
    } else {
      // 使用提供的中间点
      for (let i = 1; i < points.length - 1; i++) {
        path.push(points[i].x, points[i].y);
      }
    }

    path.push(end.x, end.y);
    return path;
  };

  const pathPoints = calculateOrthogonalPath(connection.points);

  // 渲染流动动画
  const renderFlowAnimation = () => {
    if (!connection.flow?.enabled) return null;

    // TODO: 实现流动动画
    return null;
  };

  // 连线样式
  const lineStyle = {
    stroke: connection.style.stroke || '#666',
    strokeWidth: connection.style.strokeWidth || 2,
    dash: connection.style.strokeDasharray ? 
      connection.style.strokeDasharray.split(',').map(Number) : undefined,
  };

  // 选中时的样式
  const selectedStyle = isSelected ? {
    shadowColor: '#1890ff',
    shadowBlur: 10,
    shadowOpacity: 0.5,
  } : {};

  return (
    <Group>
      {/* 隐形的粗线用于更容易点击 */}
      <Line
        points={pathPoints}
        stroke="transparent"
        strokeWidth={10}
        onClick={onSelect}
        onTap={onSelect}
      />

      {/* 实际的连线 */}
      <Line
        points={pathPoints}
        {...lineStyle}
        {...selectedStyle}
        tension={0}
        lineJoin="round"
        lineCap="round"
      />

      {/* 箭头（如果需要） */}
      {connection.style.arrow && pathPoints.length >= 4 && (
        <Arrow
          points={pathPoints.slice(-4)}
          pointerLength={8}
          pointerWidth={8}
          fill={lineStyle.stroke}
          stroke={lineStyle.stroke}
          strokeWidth={1}
        />
      )}

      {/* 连接点标记 */}
      {isSelected && (
        <>
          <Circle
            x={pathPoints[0]}
            y={pathPoints[1]}
            radius={4}
            fill="#1890ff"
            stroke="#fff"
            strokeWidth={2}
          />
          <Circle
            x={pathPoints[pathPoints.length - 2]}
            y={pathPoints[pathPoints.length - 1]}
            radius={4}
            fill="#1890ff"
            stroke="#fff"
            strokeWidth={2}
          />
        </>
      )}

      {/* 流动动画 */}
      {renderFlowAnimation()}
    </Group>
  );
};

export default Connection;