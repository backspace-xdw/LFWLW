import React from 'react';
import { Rect, Line, Group } from 'react-konva';

interface GridBackgroundProps {
  width: number;
  height: number;
  gridSize: number;
  color?: string;
  strokeWidth?: number;
}

const GridBackground: React.FC<GridBackgroundProps> = ({
  width,
  height,
  gridSize = 20,
  color = '#e0e0e0',
  strokeWidth = 0.5,
}) => {
  const lines = React.useMemo(() => {
    const result = [];
    
    // 垂直线
    for (let x = 0; x <= width; x += gridSize) {
      result.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={color}
          strokeWidth={strokeWidth}
          listening={false}
        />
      );
    }
    
    // 水平线
    for (let y = 0; y <= height; y += gridSize) {
      result.push(
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={color}
          strokeWidth={strokeWidth}
          listening={false}
        />
      );
    }
    
    // 主网格线（每5条线加粗）
    for (let x = 0; x <= width; x += gridSize * 5) {
      result.push(
        <Line
          key={`v-major-${x}`}
          points={[x, 0, x, height]}
          stroke={color}
          strokeWidth={strokeWidth * 2}
          opacity={0.5}
          listening={false}
        />
      );
    }
    
    for (let y = 0; y <= height; y += gridSize * 5) {
      result.push(
        <Line
          key={`h-major-${y}`}
          points={[0, y, width, y]}
          stroke={color}
          strokeWidth={strokeWidth * 2}
          opacity={0.5}
          listening={false}
        />
      );
    }
    
    return result;
  }, [width, height, gridSize, color, strokeWidth]);

  return (
    <Group listening={false}>
      {/* 背景 */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#ffffff"
        listening={false}
      />
      {/* 网格线 */}
      {lines}
    </Group>
  );
};

export default GridBackground;