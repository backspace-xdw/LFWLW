/**
 * 简单多边形边框示例集合
 * 可直接复制使用的5种边框方案
 */

import React from 'react'
import './SimplePolygonBorders.scss'

export const PolygonBorderExamples: React.FC = () => {
  return (
    <div className="examples-container">
      <h2>多边形边框示例集合</h2>

      {/* 示例1: 纯CSS梯形边框 */}
      <div className="example-card">
        <h3>1. 纯CSS梯形边框 (clip-path)</h3>
        <div className="trapezoid-box-1">
          <div className="content">
            使用 clip-path 创建梯形<br/>
            性能最优,兼容性好
          </div>
        </div>
        <pre>{`
.trapezoid-box-1 {
  clip-path: polygon(8% 0%, 92% 0%, 98% 100%, 2% 100%);
  border: 2px solid rgba(0, 180, 255, 0.7);
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.5);
}
        `}</pre>
      </div>

      {/* 示例2: 发光脉冲边框 */}
      <div className="example-card">
        <h3>2. 发光脉冲边框</h3>
        <div className="trapezoid-box-2">
          <div className="content">
            带发光脉冲动画<br/>
            科技感十足
          </div>
        </div>
        <pre>{`
.trapezoid-box-2 {
  clip-path: polygon(10% 0%, 90% 0%, 95% 100%, 5% 100%);
  animation: glowPulse 2s infinite;
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 180, 255, 0.5); }
  50% { box-shadow: 0 0 30px rgba(0, 180, 255, 0.9); }
}
        `}</pre>
      </div>

      {/* 示例3: 四角装饰边框 */}
      <div className="example-card">
        <h3>3. 四角装饰边框 (伪元素)</h3>
        <div className="trapezoid-box-3">
          <div className="content">
            使用伪元素添加角标<br/>
            常用于大屏设计
          </div>
        </div>
        <pre>{`
.trapezoid-box-3::before,
.trapezoid-box-3::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #00dcff;
}

.trapezoid-box-3::before {
  top: 0; left: 0;
  border-right: none;
  border-bottom: none;
}
        `}</pre>
      </div>

      {/* 示例4: 渐变边框 */}
      <div className="example-card">
        <h3>4. 渐变发光边框</h3>
        <div className="trapezoid-box-4">
          <div className="content">
            渐变色边框<br/>
            多彩科技感
          </div>
        </div>
        <pre>{`
.trapezoid-box-4 {
  background:
    linear-gradient(#0a1628, #0a1628) padding-box,
    linear-gradient(135deg, #00dcff, #0096ff, #00dcff) border-box;
  border: 3px solid transparent;
}
        `}</pre>
      </div>

      {/* 示例5: 扫描线效果 */}
      <div className="example-card">
        <h3>5. 扫描线动画效果</h3>
        <div className="trapezoid-box-5">
          <div className="scan-line"></div>
          <div className="content">
            带扫描线动画<br/>
            动态科技感
          </div>
        </div>
        <pre>{`
.scan-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: rgba(0, 220, 255, 0.5);
  animation: scan 3s linear infinite;
}

@keyframes scan {
  0% { top: 0%; }
  100% { top: 100%; }
}
        `}</pre>
      </div>
    </div>
  )
}
