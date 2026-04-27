/**
 * 视频监控卡片组件
 * 提取重复的视频播放卡片
 */
import React from 'react'
import { Card } from 'antd'
import { VideoCardProps } from '../types'
import { TitleDecoration } from './TitleDecoration'
import styles from '../index.module.scss'

export const VideoCard: React.FC<VideoCardProps> = ({
  camera,
  titleGradientId,
  className,
}) => {
  const handleFullscreen = (e: React.MouseEvent<HTMLButtonElement>) => {
    const video = e.currentTarget
      .closest(`.${styles.videoWrapper}`)
      ?.querySelector('video')
    if (video) {
      video.requestFullscreen?.()
    }
  }

  return (
    <Card
      style={{ marginTop: '4px' }}
      className={`${styles.card} ${styles.noBorder} ${className || ''}`}
      title={
        <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
          <div
            style={{
              paddingLeft: '5%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className={styles.liveIndicator}></span>
            {camera.name}
          </div>
          <TitleDecoration gradientId={titleGradientId} color="green" />
        </div>
      }
      variant="borderless"
    >
      <div className={styles.videoContainer}>
        <div className={styles.videoWrapper}>
          <video
            className={styles.videoPlayer}
            autoPlay
            muted
            loop
            playsInline
            poster={camera.poster}
          >
            <source src={camera.src} type="video/mp4" />
            您的浏览器不支持视频播放
          </video>
          <div className={styles.videoOverlay}>
            <div className={styles.videoInfo}>
              <span className={styles.cameraName}>{camera.id}</span>
              <span className={styles.cameraLocation}>{camera.location}</span>
            </div>
            <div className={styles.videoControls}>
              <button
                className={styles.videoBtn}
                title="全屏"
                onClick={handleFullscreen}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default VideoCard
