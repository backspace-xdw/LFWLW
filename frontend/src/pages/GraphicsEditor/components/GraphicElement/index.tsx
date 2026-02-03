import React, { useRef } from 'react';
import { Group, Rect, Text, Path, Circle, Line, Shape } from 'react-konva';
import Konva from 'konva';
import { GraphicElement as GraphicElementType } from '../../types';
import { getTemplate } from '../../templates';
import { useEditorStore } from '../../store/editorStore';

// 导入优化后的符号组件
import Motor from '../../../../components/GraphicsEditor/symbols/Motor';
import Pump from '../../../../components/GraphicsEditor/symbols/Pump';
import Valve from '../../../../components/GraphicsEditor/symbols/Valve';
import Tank from '../../../../components/GraphicsEditor/symbols/Tank';
import Sensor from '../../../../components/GraphicsEditor/symbols/Sensor';
import Pipe from '../../../../components/GraphicsEditor/symbols/Pipe';

interface GraphicElementProps {
  element: GraphicElementType;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransform: (e: Konva.KonvaEventObject<Event>) => void;
}

const GraphicElement: React.FC<GraphicElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransform,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const { snapToGrid, gridSize } = useEditorStore();

  // 渲染SVG路径
  const renderSVGContent = (svgData: string) => {
    // 解析SVG数据
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<svg>${svgData}</svg>`, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) return null;

    const elements: React.ReactNode[] = [];
    let key = 0;

    // 递归解析SVG元素
    const parseElement = (el: Element, parentTransform = '') => {
      const transform = el.getAttribute('transform') || '';
      const fullTransform = parentTransform + ' ' + transform;

      switch (el.tagName) {
        case 'g':
          // 递归处理组内元素
          Array.from(el.children).forEach(child => {
            parseElement(child, fullTransform);
          });
          break;

        case 'circle':
          elements.push(
            <Circle
              key={key++}
              x={parseFloat(el.getAttribute('cx') || '0')}
              y={parseFloat(el.getAttribute('cy') || '0')}
              radius={parseFloat(el.getAttribute('r') || '0')}
              fill={el.getAttribute('fill') || '#000'}
              stroke={el.getAttribute('stroke') || ''}
              strokeWidth={parseFloat(el.getAttribute('stroke-width') || '0')}
              opacity={parseFloat(el.getAttribute('opacity') || '1')}
            />
          );
          break;

        case 'rect':
          elements.push(
            <Rect
              key={key++}
              x={parseFloat(el.getAttribute('x') || '0')}
              y={parseFloat(el.getAttribute('y') || '0')}
              width={parseFloat(el.getAttribute('width') || '0')}
              height={parseFloat(el.getAttribute('height') || '0')}
              cornerRadius={parseFloat(el.getAttribute('rx') || '0')}
              fill={el.getAttribute('fill') || '#000'}
              stroke={el.getAttribute('stroke') || ''}
              strokeWidth={parseFloat(el.getAttribute('stroke-width') || '0')}
              opacity={parseFloat(el.getAttribute('opacity') || '1')}
            />
          );
          break;

        case 'line':
          elements.push(
            <Line
              key={key++}
              points={[
                parseFloat(el.getAttribute('x1') || '0'),
                parseFloat(el.getAttribute('y1') || '0'),
                parseFloat(el.getAttribute('x2') || '0'),
                parseFloat(el.getAttribute('y2') || '0'),
              ]}
              stroke={el.getAttribute('stroke') || '#000'}
              strokeWidth={parseFloat(el.getAttribute('stroke-width') || '1')}
              opacity={parseFloat(el.getAttribute('opacity') || '1')}
            />
          );
          break;

        case 'path':
          elements.push(
            <Path
              key={key++}
              data={el.getAttribute('d') || ''}
              fill={el.getAttribute('fill') || 'none'}
              stroke={el.getAttribute('stroke') || '#000'}
              strokeWidth={parseFloat(el.getAttribute('stroke-width') || '1')}
              opacity={parseFloat(el.getAttribute('opacity') || '1')}
            />
          );
          break;

        case 'text':
          elements.push(
            <Text
              key={key++}
              x={parseFloat(el.getAttribute('x') || '0')}
              y={parseFloat(el.getAttribute('y') || '0') - 5} // 调整文本基线
              text={el.textContent || ''}
              fontSize={parseFloat(el.getAttribute('font-size') || '12')}
              fontFamily={el.getAttribute('font-family') || 'Arial'}
              fill={el.getAttribute('fill') || '#000'}
              align={el.getAttribute('text-anchor') === 'middle' ? 'center' : 'left'}
            />
          );
          break;

        case 'ellipse':
          elements.push(
            <Shape
              key={key++}
              sceneFunc={(context, shape) => {
                const cx = parseFloat(el.getAttribute('cx') || '0');
                const cy = parseFloat(el.getAttribute('cy') || '0');
                const rx = parseFloat(el.getAttribute('rx') || '0');
                const ry = parseFloat(el.getAttribute('ry') || '0');
                
                context.beginPath();
                context.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                context.closePath();
                context.fillStrokeShape(shape);
              }}
              fill={el.getAttribute('fill') || '#000'}
              stroke={el.getAttribute('stroke') || ''}
              strokeWidth={parseFloat(el.getAttribute('stroke-width') || '0')}
              opacity={parseFloat(el.getAttribute('opacity') || '1')}
            />
          );
          break;
      }
    };

    // 解析所有子元素
    Array.from(svgElement.children).forEach(child => {
      parseElement(child);
    });

    return elements;
  };

  // 获取元素模板
  const template = getTemplate(element.type);
  
  // 渲染元素内容
  const renderContent = () => {
    // 使用优化后的符号组件
    // 注意：符号组件使用中心定位，需要将 x/y 设置为元素尺寸的一半
    const symbolProps = {
      id: element.id,
      x: element.size.width / 2,  // 中心点 X
      y: element.size.height / 2, // 中心点 Y
      width: element.size.width,
      height: element.size.height,
      rotation: 0,
      deviceId: element.properties?.tag,
      deviceData: element.properties?.deviceData,
      showLabel: false, // 在编辑模式下不显示标签，由 GraphicElement 统一处理
      hasAlarm: element.properties?.hasAlarm || false,
      isMonitorMode: false,
      isSelected: false,
      onSelect: undefined,
      onChange: undefined,
    };

    // 根据元素类型选择符号组件
    switch (element.type) {
      case 'motor':
        return <Motor {...symbolProps} />;
      case 'pump':
        return <Pump {...symbolProps} />;
      case 'valve':
        return <Valve {...symbolProps} />;
      case 'tank':
        return <Tank {...symbolProps} />;
      case 'instrument':
        return <Sensor {...symbolProps} sensorType="generic" />;
      case 'pipe':
        return <Pipe
          {...symbolProps}
          points={element.properties?.points || [0, 0, element.size.width, 0]}
          strokeWidth={element.properties?.strokeWidth || 8}
          hasFlow={element.properties?.hasFlow || false}
          flowDirection={element.properties?.flowDirection || 'forward'}
        />;
      default:
        // 使用SVG模板或默认矩形
        if (template && template.graphics.type === 'svg') {
          return renderSVGContent(template.graphics.data);
        }
        return (
          <Rect
            width={element.size.width}
            height={element.size.height}
            fill={element.style?.fill || '#ddd'}
            stroke={element.style?.stroke || '#666'}
            strokeWidth={element.style?.strokeWidth || 1}
          />
        );
    }
  };

  // 处理拖拽结束，实现网格对齐
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (snapToGrid && gridSize > 0) {
      const node = e.target;
      const x = Math.round(node.x() / gridSize) * gridSize;
      const y = Math.round(node.y() / gridSize) * gridSize;
      node.position({ x, y });
    }
    onDragEnd(e);
  };

  // 渲染选择框
  const renderSelection = () => {
    if (!isSelected) return null;

    return (
      <>
        {/* 选择边框 */}
        <Rect
          x={-2}
          y={-2}
          width={element.size.width + 4}
          height={element.size.height + 4}
          stroke="#1890ff"
          strokeWidth={2}
          fill="transparent"
          dash={[5, 5]}
          listening={false}
        />
        
        {/* 控制点 */}
        {[
          { x: -4, y: -4 }, // 左上
          { x: element.size.width - 4, y: -4 }, // 右上
          { x: -4, y: element.size.height - 4 }, // 左下
          { x: element.size.width - 4, y: element.size.height - 4 }, // 右下
        ].map((pos, index) => (
          <Rect
            key={index}
            x={pos.x}
            y={pos.y}
            width={8}
            height={8}
            fill="#1890ff"
            stroke="#fff"
            strokeWidth={1}
            listening={false}
          />
        ))}
      </>
    );
  };

  // 渲染连接点
  const renderPorts = () => {
    if (!element.ports || !isSelected) return null;

    return element.ports.map((port) => {
      const x = port.position.x * element.size.width;
      const y = port.position.y * element.size.height;

      return (
        <Circle
          key={port.id}
          x={x}
          y={y}
          radius={4}
          fill="#fff"
          stroke="#1890ff"
          strokeWidth={2}
          name={`port-${port.id}`}
          // 连接点可以单独处理点击事件
          onClick={(e) => {
            e.cancelBubble = true;
            console.log('Port clicked:', port.id);
          }}
        />
      );
    });
  };

  return (
    <Group
      ref={groupRef}
      id={element.id}
      x={element.position.x}
      y={element.position.y}
      rotation={element.rotation}
      scaleX={1}
      scaleY={1}
      draggable={!element.locked}
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      onTransform={onTransform}
      opacity={element.visible !== false ? (element.style?.opacity || 1) : 0}
    >
      {/* 元素内容 */}
      {renderContent()}
      
      {/* 选择框 */}
      {renderSelection()}
      
      {/* 连接点 */}
      {renderPorts()}
      
      {/* 元素名称标签 */}
      {element.name && (
        <Text
          x={0}
          y={element.size.height + 5}
          text={element.name}
          fontSize={12}
          fill="#666"
          align="center"
          width={element.size.width}
        />
      )}
    </Group>
  );
};

export default GraphicElement;