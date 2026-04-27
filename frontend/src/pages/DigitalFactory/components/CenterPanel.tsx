/**
 * 中间面板组件
 * 包含八边形边框和底部状态栏
 */
import React from 'react'
import { CenterPanelProps } from '../types'
import styles from '../index.module.scss'

export const CenterPanel: React.FC<CenterPanelProps> = ({
  equipmentStatus,
  octagonBorderRef,
}) => {
  return (
    <div className={styles.centerPanel}>
      {/* 八边形边框 - 使用SVG绘制 */}
      <svg
        className={styles.octagonBorderSvg}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        ref={octagonBorderRef}
      >
        <defs>
          {/* 白色渐变流光效果 */}
          <linearGradient
            id="flowGradientColor"
            gradientUnits="objectBoundingBox"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
            <stop offset="10%" style={{ stopColor: '#ffffff', stopOpacity: 0.1 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
            <stop offset="90%" style={{ stopColor: '#ffffff', stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </linearGradient>

          {/* 流光滤镜 */}
          <filter id="reflectionGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="2 0 0 0 0  0 2 0 0 0  0 0 2 0 0  0 0 0 2.5 0"
              result="bright"
            />
            <feMerge>
              <feMergeNode in="bright" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 上下渐变 - 外层边框 */}
          <linearGradient id="outerBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
            <stop offset="5%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
            <stop offset="75%" style={{ stopColor: '#2196f3', stopOpacity: 1 }} />
            <stop offset="95%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
          </linearGradient>

          {/* 上下渐变 - 内层边框 */}
          <linearGradient id="innerBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
            <stop offset="8%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
            <stop offset="75%" style={{ stopColor: '#2196f3', stopOpacity: 0.3 }} />
            <stop offset="92%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: '#2196f3', stopOpacity: 0 }} />
          </linearGradient>

          {/* 发光滤镜 */}
          <filter id="borderGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 背景填充 - 八边形内部亮蓝色调 */}
          <linearGradient id="backgroundGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#7ab8ff', stopOpacity: 0 }} />
            <stop offset="10%" style={{ stopColor: '#7ab8ff', stopOpacity: 0 }} />
            <stop offset="30%" style={{ stopColor: '#5aa7ff', stopOpacity: 0.06 }} />
            <stop offset="50%" style={{ stopColor: '#4a9eff', stopOpacity: 0.08 }} />
            <stop offset="70%" style={{ stopColor: '#2e7fd9', stopOpacity: 0.06 }} />
            <stop offset="90%" style={{ stopColor: '#1e5a8a', stopOpacity: 0.03 }} />
            <stop offset="100%" style={{ stopColor: '#1e5a8a', stopOpacity: 0.02 }} />
          </linearGradient>
        </defs>

        {/* 八边形亮光透明背景 */}
        <path
          d="M 351 50 L 691 50 Q 731 50 761 80 L 876 195 Q 911 230 911 270 L 911 680 Q 911 720 876 755 L 761 870 Q 731 900 691 900 L 351 900 Q 311 900 281 870 L 166 755 Q 131 720 131 680 L 131 270 Q 131 230 166 195 L 281 80 Q 311 50 351 50 Z"
          fill="url(#backgroundGlow)"
          stroke="none"
        />

        {/* 外层边框 - 深蓝色八边形 */}
        <path
          d="M 351 50 L 691 50 Q 731 50 761 80 L 876 195 Q 911 230 911 270 L 911 680 Q 911 720 876 755 L 761 870 Q 731 900 691 900 L 351 900 Q 311 900 281 870 L 166 755 Q 131 720 131 680 L 131 270 Q 131 230 166 195 L 281 80 Q 311 50 351 50 Z"
          fill="none"
          stroke="url(#outerBorderGradient)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* 内层边框 - 浅蓝色八边形 */}
        <path
          d="M 364 68 L 678 68 Q 713 68 738 93 L 863 218 Q 893 248 893 283 L 893 667 Q 893 702 863 732 L 738 857 Q 713 882 678 882 L 364 882 Q 329 882 304 857 L 179 732 Q 149 702 149 667 L 149 283 Q 149 248 179 218 L 304 93 Q 329 68 364 68 Z"
          fill="none"
          stroke="url(#innerBorderGradient)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* 反光流光效果 - 左侧 */}
        <path
          d="M 281 80 L 166 195 Q 131 230 131 270 L 131 680 Q 131 720 166 755 L 281 870"
          fill="none"
          stroke="url(#flowGradientColor)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="150 1000"
          filter="url(#reflectionGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-1150"
            dur="5s"
            repeatCount="indefinite"
          />
        </path>

        {/* 反光流光效果 - 右侧 */}
        <path
          d="M 761 80 L 876 195 Q 911 230 911 270 L 911 680 Q 911 720 876 755 L 761 870"
          fill="none"
          stroke="url(#flowGradientColor)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="150 1000"
          filter="url(#reflectionGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-1150"
            dur="5s"
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {/* 底部装饰性进度条 */}
      <div className={styles.bottomDecorationBar}>
        <div className={styles.decorationLabels}>
          <span className={styles.labelLeft}>总数: {equipmentStatus.total}台</span>
          <span className={styles.labelCenter}>开机: {equipmentStatus.running}台</span>
          <span className={styles.labelRight}>未运行: {equipmentStatus.idle}台</span>
        </div>
        <div className={styles.progressBarWrapper}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
          >
            {/* 进度条背景 - 平行四边形 */}
            <polygon
              points="2,3 100,3 98,7 0,7"
              fill="rgba(0, 100, 200, 0.15)"
            />
            {/* 进度条前景 - 平行四边形 */}
            <polygon
              points={`2,3 ${2 + (equipmentStatus.running / equipmentStatus.total) * 85},3 ${(equipmentStatus.running / equipmentStatus.total) * 85},7 0,7`}
              fill="#2196f3"
            />
            {/* 橙色端点 - 平行四边形 */}
            <polygon
              points="85,2 87.5,2 85.76,8 83.26,8"
              fill="#ff8800"
            >
              <animate
                attributeName="opacity"
                values="0.8;1;0.8"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </polygon>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default CenterPanel
