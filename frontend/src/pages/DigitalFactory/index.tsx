/**
 * 数字工厂页面
 * TTF数字工厂管网监控系统
 *
 * 重构后的主文件，从2468行减少到约300行
 * - 组件拆分到 components/ 目录
 * - 配置提取到 config/ 目录
 * - 工具函数提取到 utils/ 目录
 * - 数据管理通过 hooks/ 实现
 */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { ViewPresetKey } from './types'
import {
  Header,
  LeftPanel,
  RightPanel,
  CenterPanel,
  Scene3D,
  Scene3DRef,
  ViewPresetControls,
} from './components'
import { useDigitalFactoryData } from './hooks/useDigitalFactoryData'
import styles from './index.module.scss'

const DigitalFactory: React.FC = () => {
  // ===== 状态 =====
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeViewPreset, setActiveViewPreset] = useState<ViewPresetKey>('overview')
  const [productionOverviewPeriod, setProductionOverviewPeriod] = useState<
    '日' | '周' | '月'
  >('日')

  // 模型加载状态
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('正在加载3D场景...')

  // 遮罩状态
  const [maskPath, setMaskPath] = useState<string>('')
  const [maskViewBox, setMaskViewBox] = useState<{ width: number; height: number }>({
    width: 1920,
    height: 1080,
  })

  // ===== Refs =====
  const containerRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const octagonBorderRef = useRef<SVGSVGElement>(null)
  const scene3DRef = useRef<Scene3DRef>(null)

  // ===== 数据 =====
  const { data, refetchProductionOverview } = useDigitalFactoryData()

  // 时段切换时重新获取生产概览
  useEffect(() => {
    refetchProductionOverview(productionOverviewPeriod)
  }, [productionOverviewPeriod])

  // ===== 时间更新 =====
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ===== 全屏切换 =====
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(() => {})
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(() => {})
    }
  }, [])

  // ===== 监听全屏变化 =====
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isContainerFullscreen =
        document.fullscreenElement === containerRef.current
      setIsFullscreen(isContainerFullscreen)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // ===== 构建遮罩路径 =====
  useEffect(() => {
    const buildMask = () => {
      if (!mainContentRef.current || !octagonBorderRef.current) return

      const mainRect = mainContentRef.current.getBoundingClientRect()
      const octRect = octagonBorderRef.current.getBoundingClientRect()

      const scaleX = octRect.width / 1000
      const scaleY = octRect.height / 1000
      const offsetX = octRect.left - mainRect.left
      const offsetY = octRect.top - mainRect.top

      const p = (x: number, y: number) =>
        `${(offsetX + x * scaleX).toFixed(1)} ${(offsetY + y * scaleY).toFixed(1)}`

      const d = [
        `M ${p(351, 50)}`,
        `L ${p(691, 50)}`,
        `Q ${p(731, 50)} ${p(761, 80)}`,
        `L ${p(876, 195)}`,
        `Q ${p(911, 230)} ${p(911, 270)}`,
        `L ${p(911, 680)}`,
        `Q ${p(911, 720)} ${p(876, 755)}`,
        `L ${p(761, 870)}`,
        `Q ${p(731, 900)} ${p(691, 900)}`,
        `L ${p(351, 900)}`,
        `Q ${p(311, 900)} ${p(281, 870)}`,
        `L ${p(166, 755)}`,
        `Q ${p(131, 720)} ${p(131, 680)}`,
        `L ${p(131, 270)}`,
        `Q ${p(131, 230)} ${p(166, 195)}`,
        `L ${p(281, 80)}`,
        `Q ${p(311, 50)} ${p(351, 50)}`,
        'Z',
      ].join(' ')

      setMaskPath(d)
      setMaskViewBox({ width: mainRect.width, height: mainRect.height })
    }

    buildMask()

    const handleResize = () => buildMask()
    window.addEventListener('resize', handleResize)

    const resizeObserver = new ResizeObserver(() => buildMask())
    if (mainContentRef.current) resizeObserver.observe(mainContentRef.current)
    if (octagonBorderRef.current) resizeObserver.observe(octagonBorderRef.current)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
    }
  }, [])

  // ===== 视角切换处理 =====
  const handleViewPresetChange = useCallback((preset: ViewPresetKey) => {
    setActiveViewPreset(preset)
    scene3DRef.current?.switchToPresetView(preset)
  }, [])

  // ===== 模型加载回调 =====
  const handleLoadProgress = useCallback((progress: number, text: string) => {
    setModelLoadingProgress(progress)
    setLoadingText(text)
  }, [])

  const handleLoadComplete = useCallback(() => {
    setIsModelLoading(false)
  }, [])

  // ===== 数据检查 =====
  if (!data) {
    return (
      <div className={styles.digitalFactory}>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.digitalFactory} ${isFullscreen ? styles.fullscreenMode : ''}`}
    >
      {/* 顶部标题栏 */}
      <Header
        currentTime={currentTime}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* 主要内容区 */}
      <div className={styles.mainContent} ref={mainContentRef}>
        {/* 3D场景作为全局背景 */}
        <Scene3D
          ref={scene3DRef}
          onLoadProgress={handleLoadProgress}
          onLoadComplete={handleLoadComplete}
        />

        {/* 模型加载进度条 */}
        {isModelLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContent}>
              <div className={styles.loadingSpinner}></div>
              <div className={styles.loadingText}>{loadingText}</div>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${modelLoadingProgress}%` }}
                ></div>
              </div>
              <div className={styles.progressText}>
                {Math.round(modelLoadingProgress)}%
              </div>
            </div>
          </div>
        )}

        {/* 预设视角控制按钮 */}
        <ViewPresetControls
          activePreset={activeViewPreset}
          onPresetChange={handleViewPresetChange}
        />

        {/* 全屏遮罩：动态镂空八边形 */}
        {maskPath && (
          <svg
            className={styles.fullScreenMaskSvg}
            viewBox={`0 0 ${maskViewBox.width} ${maskViewBox.height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <filter
                id="octagonFeatherSoft"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="24" />
              </filter>
              <filter
                id="octagonFeatherWide"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="46" />
              </filter>
              <linearGradient
                id="maskFadeGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(3, 8, 16, 0.22)" />
                <stop offset="18%" stopColor="rgba(3, 8, 16, 0.34)" />
                <stop offset="50%" stopColor="rgba(3, 8, 16, 0.68)" />
                <stop offset="82%" stopColor="rgba(3, 8, 16, 0.34)" />
                <stop offset="100%" stopColor="rgba(3, 8, 16, 0.22)" />
              </linearGradient>
              <mask
                id="octagonWindowMask"
                x="0"
                y="0"
                width={maskViewBox.width}
                height={maskViewBox.height}
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <path d={maskPath} fill="black" />
                <path
                  d={maskPath}
                  fill="none"
                  stroke="black"
                  strokeWidth="60"
                  filter="url(#octagonFeatherSoft)"
                  opacity="0.5"
                />
                <path
                  d={maskPath}
                  fill="none"
                  stroke="black"
                  strokeWidth="130"
                  filter="url(#octagonFeatherWide)"
                  opacity="0.32"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#maskFadeGradient)"
              mask="url(#octagonWindowMask)"
            />
          </svg>
        )}

        {/* 左侧面板 */}
        <LeftPanel
          qualificationRate={data.qualificationRate}
          productQuality={data.productQuality}
          inventory={data.inventory}
          exceptions={data.exceptions}
          alarms={data.alarms}
        />

        {/* 中间面板 */}
        <CenterPanel
          equipmentStatus={data.equipmentStatus}
          octagonBorderRef={octagonBorderRef}
        />

        {/* 右侧面板 */}
        <RightPanel
          productionOverview={data.productionOverview}
          cameras={data.cameras}
          period={productionOverviewPeriod}
          onPeriodChange={setProductionOverviewPeriod}
        />
      </div>
    </div>
  )
}

export default DigitalFactory
