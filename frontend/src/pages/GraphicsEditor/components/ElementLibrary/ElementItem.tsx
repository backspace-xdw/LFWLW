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

  const handleDragEnd = (_e: React.DragEvent) => {
    // 清理拖拽状态
    // 注意：元素创建由画布的 onDrop 事件处理，这里不再调用 onDragEnd
    // 避免重复创建元素
    dragRef.current = null;
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
              {renderElementSVG(template.id)}
            </svg>
          )}
        </div>
        <div className={styles.name}>{template.name}</div>
      </div>
    </Tooltip>
  );
};

// 渲染元素SVG预览 - 按元素ID区分不同图标
const renderElementSVG = (id: string) => {
  switch (id) {
    // ===== 泵类 =====
    // 离心泵：圆形泵体 + 叶轮曲线 + 进出口管线
    case 'pump_centrifugal':
      return (
        <>
          <circle cx="50" cy="30" r="22" fill="#4096ff" opacity="0.8" stroke="#2563eb" strokeWidth="2" />
          <path d="M 28 30 Q 50 12, 72 30 Q 50 48, 28 30" fill="#60a5fa" stroke="#2563eb" strokeWidth="1" />
          <line x1="10" y1="30" x2="28" y2="30" stroke="#333" strokeWidth="3" />
          <line x1="72" y1="30" x2="90" y2="30" stroke="#333" strokeWidth="3" />
        </>
      );
    // 齿轮泵：矩形泵体 + 双齿轮 + 进出口管线
    case 'pump_gear':
      return (
        <>
          <rect x="30" y="15" width="40" height="30" rx="4" fill="#8b5cf6" opacity="0.8" stroke="#7c3aed" strokeWidth="2" />
          <circle cx="43" cy="30" r="8" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.5" />
          <circle cx="57" cy="30" r="8" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.5" />
          {/* 齿轮齿 */}
          <path d="M 43 22 L 45 20 L 41 20 Z" fill="#7c3aed" />
          <path d="M 57 22 L 59 20 L 55 20 Z" fill="#7c3aed" />
          <line x1="10" y1="30" x2="30" y2="30" stroke="#333" strokeWidth="3" />
          <line x1="70" y1="30" x2="90" y2="30" stroke="#333" strokeWidth="3" />
        </>
      );

    // ===== 阀门类 =====
    // 球阀：蝶形阀体 + 球体 + 手柄
    case 'valve_ball':
      return (
        <>
          <line x1="15" y1="30" x2="35" y2="30" stroke="#333" strokeWidth="3" />
          <line x1="65" y1="30" x2="85" y2="30" stroke="#333" strokeWidth="3" />
          <polygon points="35,18 50,30 35,42" fill="#52c41a" opacity="0.8" stroke="#389e0d" strokeWidth="1.5" />
          <polygon points="65,18 50,30 65,42" fill="#52c41a" opacity="0.8" stroke="#389e0d" strokeWidth="1.5" />
          <circle cx="50" cy="30" r="6" fill="#73d13d" stroke="#389e0d" strokeWidth="1.5" />
          <line x1="50" y1="24" x2="50" y2="10" stroke="#333" strokeWidth="2" />
          <line x1="44" y1="10" x2="56" y2="10" stroke="#333" strokeWidth="2" />
        </>
      );
    // 闸阀：矩形阀体 + 闸板 + 手轮
    case 'valve_gate':
      return (
        <>
          <line x1="15" y1="30" x2="35" y2="30" stroke="#333" strokeWidth="3" />
          <line x1="65" y1="30" x2="85" y2="30" stroke="#333" strokeWidth="3" />
          <polygon points="35,18 50,30 35,42" fill="#faad14" opacity="0.8" stroke="#d48806" strokeWidth="1.5" />
          <polygon points="65,18 50,30 65,42" fill="#faad14" opacity="0.8" stroke="#d48806" strokeWidth="1.5" />
          <rect x="47" y="10" width="6" height="18" fill="#ffc53d" stroke="#d48806" strokeWidth="1" />
          <circle cx="50" cy="8" r="5" fill="none" stroke="#d48806" strokeWidth="2" />
        </>
      );
    // 止回阀：圆形阀体 + 箭头三角
    case 'valve_check':
      return (
        <>
          <line x1="15" y1="30" x2="35" y2="30" stroke="#333" strokeWidth="3" />
          <line x1="65" y1="30" x2="85" y2="30" stroke="#333" strokeWidth="3" />
          <circle cx="50" cy="30" r="14" fill="none" stroke="#13c2c2" strokeWidth="2" />
          <polygon points="42,30 56,23 56,37" fill="#36cfc9" stroke="#13c2c2" strokeWidth="1" />
          <line x1="56" y1="20" x2="56" y2="40" stroke="#13c2c2" strokeWidth="2" />
        </>
      );

    // ===== 容器类 =====
    // 储罐：立式圆柱罐 + 液位线 + 弧顶弧底
    case 'tank_storage':
      return (
        <>
          <rect x="30" y="10" width="40" height="42" rx="3" fill="#1890ff" opacity="0.3" stroke="#0050b3" strokeWidth="2" />
          <rect x="30" y="32" width="40" height="20" rx="0" fill="#40a9ff" opacity="0.6" />
          <ellipse cx="50" cy="10" rx="20" ry="5" fill="#e6f7ff" stroke="#0050b3" strokeWidth="2" />
          <ellipse cx="50" cy="52" rx="20" ry="5" fill="#1890ff" opacity="0.4" stroke="#0050b3" strokeWidth="2" />
        </>
      );
    // 反应器：带椭圆封头的容器 + 搅拌器
    case 'tank_reactor':
      return (
        <>
          <ellipse cx="50" cy="14" rx="22" ry="7" fill="#fff1f0" stroke="#cf1322" strokeWidth="2" />
          <rect x="28" y="14" width="44" height="32" fill="#ff4d4f" opacity="0.25" stroke="#cf1322" strokeWidth="2" />
          <ellipse cx="50" cy="46" rx="22" ry="7" fill="#fff1f0" stroke="#cf1322" strokeWidth="2" />
          {/* 搅拌轴和叶片 */}
          <line x1="50" y1="5" x2="50" y2="40" stroke="#cf1322" strokeWidth="2.5" />
          <line x1="40" y1="32" x2="60" y2="32" stroke="#cf1322" strokeWidth="2" />
          <line x1="38" y1="38" x2="62" y2="38" stroke="#cf1322" strokeWidth="2" />
        </>
      );

    // ===== 仪表类 =====
    // 压力表：圆形表盘 + PI标识 + 红色
    case 'instrument_pressure':
      return (
        <>
          <circle cx="50" cy="26" r="18" fill="white" stroke="#ff4d4f" strokeWidth="2.5" />
          <text x="50" y="31" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#ff4d4f">PI</text>
          <line x1="50" y1="44" x2="50" y2="55" stroke="#333" strokeWidth="2" />
          {/* 指针 */}
          <line x1="50" y1="26" x2="60" y2="18" stroke="#ff4d4f" strokeWidth="1.5" />
        </>
      );
    // 温度计：圆形表盘 + TI标识 + 橙色
    case 'instrument_temperature':
      return (
        <>
          <circle cx="50" cy="26" r="18" fill="white" stroke="#fa8c16" strokeWidth="2.5" />
          <text x="50" y="31" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fa8c16">TI</text>
          <line x1="50" y1="44" x2="50" y2="55" stroke="#333" strokeWidth="2" />
          {/* 温度计水银柱 */}
          <rect x="48" y="14" width="4" height="16" rx="2" fill="#fa8c16" opacity="0.5" />
        </>
      );
    // 流量计：圆形表盘 + FI标识 + 绿色 + 横向管线
    case 'instrument_flow':
      return (
        <>
          <line x1="10" y1="30" x2="32" y2="30" stroke="#333" strokeWidth="3" />
          <line x1="68" y1="30" x2="90" y2="30" stroke="#333" strokeWidth="3" />
          <circle cx="50" cy="30" r="18" fill="white" stroke="#52c41a" strokeWidth="2.5" />
          <text x="50" y="35" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#52c41a">FI</text>
        </>
      );
    // 液位计：圆形表盘 + LI标识 + 蓝色 + 液位刻度
    case 'instrument_level':
      return (
        <>
          <circle cx="50" cy="26" r="18" fill="white" stroke="#1890ff" strokeWidth="2.5" />
          <text x="50" y="31" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1890ff">LI</text>
          {/* 液位示意 */}
          <rect x="44" y="22" width="3" height="12" fill="#1890ff" opacity="0.4" />
          <line x1="44" y1="22" x2="47" y2="22" stroke="#1890ff" strokeWidth="1" />
          <line x1="44" y1="28" x2="47" y2="28" stroke="#1890ff" strokeWidth="1" />
          <line x1="44" y1="34" x2="47" y2="34" stroke="#1890ff" strokeWidth="1" />
        </>
      );

    // ===== 管道类 =====
    // 直管：双线直管
    case 'pipe_straight':
      return (
        <>
          <line x1="10" y1="27" x2="90" y2="27" stroke="#666" strokeWidth="2" />
          <line x1="10" y1="33" x2="90" y2="33" stroke="#666" strokeWidth="2" />
          <line x1="10" y1="27" x2="10" y2="33" stroke="#666" strokeWidth="2" />
          <line x1="90" y1="27" x2="90" y2="33" stroke="#666" strokeWidth="2" />
          {/* 流向箭头 */}
          <polygon points="55,24 65,30 55,36" fill="#999" />
        </>
      );
    // 弯头：90度弯管
    case 'pipe_elbow':
      return (
        <>
          <path d="M 15 30 L 45 30 Q 55 30, 55 20 L 55 8" stroke="#666" strokeWidth="6" fill="none" strokeLinecap="round" />
          <polygon points="50,10 55,3 60,10" fill="#999" />
        </>
      );
    // 三通：T形管件
    case 'pipe_tee':
      return (
        <>
          <line x1="10" y1="30" x2="90" y2="30" stroke="#666" strokeWidth="6" />
          <line x1="50" y1="30" x2="50" y2="8" stroke="#666" strokeWidth="6" />
          <circle cx="50" cy="30" r="3" fill="#999" />
        </>
      );

    // ===== 电气元件 =====
    // 三相电机：圆形 + M标识
    case 'motor_3phase':
      return (
        <>
          <circle cx="50" cy="30" r="20" fill="#faad14" opacity="0.8" stroke="#d48806" strokeWidth="2" />
          <text x="50" y="36" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">M</text>
          <line x1="50" y1="10" x2="50" y2="5" stroke="#333" strokeWidth="3" />
          <line x1="50" y1="50" x2="50" y2="55" stroke="#333" strokeWidth="3" />
          {/* 三相标记 */}
          <text x="50" y="54" textAnchor="middle" fontSize="7" fill="#d48806">3~</text>
        </>
      );

    // ===== 标注 =====
    case 'text_label':
      return (
        <>
          <rect x="20" y="15" width="60" height="30" fill="none" stroke="#d9d9d9" strokeWidth="1.5" strokeDasharray="4,2" rx="3" />
          <text x="50" y="35" textAnchor="middle" fontSize="14" fill="#666">Text</text>
        </>
      );

    default:
      return (
        <rect x="20" y="15" width="60" height="30" fill="#d9d9d9" rx="4" />
      );
  }
};

export default ElementItem;