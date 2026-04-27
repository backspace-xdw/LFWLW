/**
 * 顶部标题栏组件
 */
import React from 'react'
import { HeaderProps } from '../types'
import styles from '../index.module.scss'

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const formattedTime = currentTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        {/* 中央标题 */}
        <div className={styles.titleContainer}>
          <div className={styles.titleWrapper}>
            <h1 className={styles.mainTitle}>TTF数字工厂管网监控系统</h1>
          </div>
        </div>

        {/* 右侧日期时间和全屏按钮 */}
        <div className={styles.rightControls}>
          <div className={styles.datetime}>{formattedTime}</div>
          <div
            className={styles.fullscreenButton}
            onClick={onToggleFullscreen}
            title={isFullscreen ? '退出全屏' : '全屏显示'}
          >
            {isFullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
