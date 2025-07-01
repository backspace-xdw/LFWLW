import React, { useRef } from 'react';
import { Tooltip } from 'antd';
import { ElementTemplate } from '../../types';
import styles from './ElementItem.module.scss';

interface ElementItemProps {
  template: ElementTemplate;
  onDragEnd: (template: ElementTemplate, position: { x: number; y: number }) => void;
}

const ElementItem: React.FC<ElementItemProps> = ({ template, onDragEnd }) => {
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY };
    
    // 设置拖拽数据
    e.dataTransfer.setData('elementTemplate', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
    
    // 设置拖拽图像
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 30);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (dragRef.current) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      // 只有拖拽距离足够远才触发
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        onDragEnd(template, { x: e.clientX, y: e.clientY });
      }
      
      dragRef.current = null;
    }
  };

  return (
    <Tooltip title={template.name} placement="right">
      <div
        className={styles.elementItem}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.icon}>
          {template.preview ? (
            <img src={template.preview} alt={template.name} />
          ) : (
            <svg viewBox="0 0 100 60" className={styles.placeholder}>
              {/* 这里根据不同类型渲染不同的SVG图形 */}
              {renderElementSVG(template.type)}
            </svg>
          )}
        </div>
        <div className={styles.name}>{template.name}</div>
      </div>
    </Tooltip>
  );
};

// 渲染元素SVG预览
const renderElementSVG = (type: string) => {
  switch (type) {
    case 'pump':
      return (
        <>
          <circle cx="50" cy="30" r="20" fill="#4096ff" opacity="0.8" />
          <path d="M 30 30 L 70 30" stroke="#333" strokeWidth="2" />
          <path d="M 50 10 L 50 50" stroke="#333" strokeWidth="2" />
        </>
      );
      
    case 'valve':
      return (
        <>
          <path d="M 20 30 L 80 30" stroke="#333" strokeWidth="3" />
          <path d="M 35 15 L 65 15 L 65 45 L 35 45 Z" fill="#52c41a" opacity="0.8" />
          <path d="M 50 15 L 50 5" stroke="#333" strokeWidth="2" />
        </>
      );
      
    case 'tank':
      return (
        <>
          <rect x="25" y="10" width="50" height="40" rx="5" fill="#1890ff" opacity="0.8" />
          <path d="M 25 35 L 75 35" stroke="#fff" strokeWidth="2" strokeDasharray="5,5" />
        </>
      );
      
    case 'pipe':
      return (
        <>
          <path d="M 10 30 L 90 30" stroke="#666" strokeWidth="4" />
          <circle cx="20" cy="30" r="4" fill="#666" />
          <circle cx="80" cy="30" r="4" fill="#666" />
        </>
      );
      
    case 'instrument':
      return (
        <>
          <circle cx="50" cy="30" r="20" fill="none" stroke="#ff4d4f" strokeWidth="2" />
          <text x="50" y="35" textAnchor="middle" fontSize="16" fill="#ff4d4f">PI</text>
        </>
      );
      
    case 'motor':
      return (
        <>
          <circle cx="50" cy="30" r="20" fill="#faad14" opacity="0.8" />
          <text x="50" y="35" textAnchor="middle" fontSize="18" fill="#fff">M</text>
        </>
      );
      
    default:
      return (
        <rect x="20" y="15" width="60" height="30" fill="#d9d9d9" rx="4" />
      );
  }
};

export default ElementItem;