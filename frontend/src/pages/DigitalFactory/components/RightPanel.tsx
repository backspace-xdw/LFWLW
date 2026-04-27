/**
 * 右侧面板组件
 * 包含产量完成概览和4个视频监控卡片
 */
import React from 'react'
import { Card } from 'antd'
import { RightPanelProps } from '../types'
import { VideoCard } from './VideoCard'
import styles from '../index.module.scss'

export const RightPanel: React.FC<RightPanelProps> = ({
  productionOverview,
  cameras,
  period,
  onPeriodChange,
}) => {
  return (
    <div className={styles.rightPanel}>
      {/* 产量完成概览 */}
      <Card
        style={{ marginTop: '4px' }}
        className={`${styles.card} ${styles.noBorder}`}
        title={
          <div
            style={{
              position: 'relative',
              paddingBottom: '5px',
              paddingTop: '10px',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ paddingLeft: '5%' }}>产量完成概览</div>
              <div className={styles.trendButtons}>
                <button
                  className={period === '日' ? styles.active : ''}
                  onClick={() => onPeriodChange('日')}
                >
                  本日
                </button>
                <button
                  className={period === '周' ? styles.active : ''}
                  onClick={() => onPeriodChange('周')}
                >
                  本周
                </button>
                <button
                  className={period === '月' ? styles.active : ''}
                  onClick={() => onPeriodChange('月')}
                >
                  本月
                </button>
              </div>
            </div>
            <svg
              style={{
                position: 'absolute',
                bottom: '5px',
                left: 0,
                width: '100%',
                height: '40px',
                marginTop: '-35px',
                pointerEvents: 'none',
              }}
              viewBox="0 -35 100 43"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="titleLineGradient2"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }}
                  />
                  <stop
                    offset="5%"
                    style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }}
                  />
                  <stop
                    offset="50%"
                    style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }}
                  />
                  <stop
                    offset="95%"
                    style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }}
                  />
                </linearGradient>
              </defs>
              <path
                d="M -5 -35 Q -15 -10 5 4 L 100 4"
                stroke="url(#titleLineGradient2)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        }
        variant="borderless"
      >
        <div className={styles.productionOverview}>
          {productionOverview.map((item, index) => (
            <div key={index} className={styles.productItem}>
              <div className={styles.productStats}>
                计划值: {item.plan}件 &nbsp; 实际值: {item.actual}件
              </div>
              <div className={styles.productRow}>
                <span className={styles.productName}>{item.name}</span>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${item.completion}%` }}
                    ></div>
                  </div>
                  <span className={styles.completionRate}>{item.completion}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 视频监控卡片 */}
      {cameras.map((camera, index) => (
        <VideoCard
          key={camera.id}
          camera={camera}
          titleGradientId={`titleLineGradientVideo${index + 1}`}
        />
      ))}
    </div>
  )
}

export default RightPanel
