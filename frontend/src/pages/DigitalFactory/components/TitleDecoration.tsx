/**
 * 标题装饰线组件
 * 提取重复的SVG装饰线，支持不同颜色主题
 */
import React from 'react'
import { TitleDecorationProps } from '../types'

const colorSchemes = {
  cyan: {
    start: 'rgba(0, 180, 255, 0)',
    mid1: 'rgba(0, 180, 255, 0.4)',
    mid2: 'rgba(0, 200, 255, 0.8)',
    mid3: 'rgba(0, 180, 255, 0.4)',
    end: 'rgba(0, 180, 255, 0)',
  },
  green: {
    start: 'rgba(0, 255, 136, 0)',
    mid1: 'rgba(0, 255, 136, 0.4)',
    mid2: 'rgba(0, 255, 170, 0.8)',
    mid3: 'rgba(0, 255, 136, 0.4)',
    end: 'rgba(0, 255, 136, 0)',
  },
  red: {
    start: 'rgba(255, 100, 100, 0)',
    mid1: 'rgba(255, 100, 100, 0.4)',
    mid2: 'rgba(255, 120, 120, 0.8)',
    mid3: 'rgba(255, 100, 100, 0.4)',
    end: 'rgba(255, 100, 100, 0)',
  },
}

export const TitleDecoration: React.FC<TitleDecorationProps> = ({
  gradientId,
  color = 'cyan',
}) => {
  const scheme = colorSchemes[color]

  return (
    <svg
      style={{
        width: '100%',
        height: '40px',
        marginTop: '-35px',
        pointerEvents: 'none',
      }}
      viewBox="0 -35 100 43"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: scheme.start, stopOpacity: 0 }} />
          <stop offset="5%" style={{ stopColor: scheme.mid1, stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: scheme.mid2, stopOpacity: 1 }} />
          <stop offset="95%" style={{ stopColor: scheme.mid3, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: scheme.end, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path
        d="M -5 -35 Q -15 -10 5 4 L 100 4"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default TitleDecoration
