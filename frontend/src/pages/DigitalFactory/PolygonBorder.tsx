import React from 'react'
import styles from './PolygonBorder.module.scss'

interface PolygonBorderProps {
  className?: string
}

/**
 * 简化边框组件 - 仅保留左右两侧边框
 * 使用SVG绘制，深蓝色主题
 */
export const PolygonBorder: React.FC<PolygonBorderProps> = ({ className }) => {
  return (
    <div className={`${styles.polygonBorder} ${className || ''}`}>
      {/* 左侧边框 - SVG绘制 */}
      <div className={styles.external1}>
        <svg className={styles.borderSvg} viewBox="0 0 100 400" preserveAspectRatio="none">
          {/* 左侧箭头形状 */}
          <path
            d="M 80 200 L 20 180 L 20 100 L 60 80 L 80 80 M 80 200 L 20 220 L 20 300 L 60 320 L 80 320"
            stroke="#1e3a8a"
            strokeWidth="3"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* 装饰线条 */}
          <line x1="85" y1="100" x2="85" y2="300" stroke="#1e3a8a" strokeWidth="2" />
          <line x1="90" y1="120" x2="90" y2="280" stroke="#1e3a8a" strokeWidth="1.5" opacity="0.6" />
          {/* 圆形装饰 */}
          <circle cx="25" cy="200" r="4" fill="#1e3a8a" />
          <circle cx="25" cy="200" r="8" fill="none" stroke="#1e3a8a" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* 右侧边框 - SVG绘制（镜像） */}
      <div className={styles.external2}>
        <svg className={styles.borderSvg} viewBox="0 0 100 400" preserveAspectRatio="none">
          {/* 右侧箭头形状（镜像） */}
          <path
            d="M 20 200 L 80 180 L 80 100 L 40 80 L 20 80 M 20 200 L 80 220 L 80 300 L 40 320 L 20 320"
            stroke="#1e3a8a"
            strokeWidth="3"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* 装饰线条 */}
          <line x1="15" y1="100" x2="15" y2="300" stroke="#1e3a8a" strokeWidth="2" />
          <line x1="10" y1="120" x2="10" y2="280" stroke="#1e3a8a" strokeWidth="1.5" opacity="0.6" />
          {/* 圆形装饰 */}
          <circle cx="75" cy="200" r="4" fill="#1e3a8a" />
          <circle cx="75" cy="200" r="8" fill="none" stroke="#1e3a8a" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
    </div>
  )
}
