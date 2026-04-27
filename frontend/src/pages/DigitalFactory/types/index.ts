/**
 * 数字工厂模块类型定义
 */

import * as THREE from 'three'

// ===== 视角预设 =====
export interface ViewPreset {
  name: string
  position: THREE.Vector3
  target: THREE.Vector3
}

export type ViewPresetKey = 'overview' | 'topView' | 'frontView' | 'sideView'

export type ViewPresets = Record<ViewPresetKey, ViewPreset>

// ===== 3D模型配置 =====
export interface ModelConfig {
  path: string
  scale: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  modelKey: string
  label: string
  primary?: boolean  // 主要模型：加载完成后立即显示场景
}

// ===== 模型加载进度 =====
export interface ModelLoadProgress {
  [key: string]: number
}

// ===== 产量完成概览 =====
export interface ProductionOverviewItem {
  name: string
  plan: number
  actual: number
  completion: number
}

// ===== 摄像头信息 =====
export interface CameraInfo {
  id: string
  name: string
  location: string
  src: string
  poster?: string
}

// ===== 告警记录 =====
export interface AlarmRecord {
  time: string
  device: string
  level: 'high' | 'medium' | 'low'
  content: string
}

// ===== 产线异常信息 =====
export interface ProductionLineException {
  year: string
  outputValue: string
  perCapitaOutput: number
  employeeCount: string
}

// ===== 本日工序合格率 =====
export interface QualificationRateData {
  inspectionCount: number
  defectCount: number
}

// ===== 产品合格率 =====
export interface ProductQualityData {
  dates: string[]
  rates: number[]
}

// ===== 仓库存料 =====
export interface InventoryData {
  years: string[]
  levels: number[]
}

// ===== 设备状态 =====
export interface EquipmentStatus {
  total: number
  running: number
  idle: number
}

// ===== 数字工厂数据 =====
export interface DigitalFactoryData {
  // 左侧面板数据
  qualificationRate: QualificationRateData
  productQuality: ProductQualityData
  inventory: InventoryData
  alarms: AlarmRecord[]
  exceptions: ProductionLineException[]

  // 中间面板数据
  equipmentStatus: EquipmentStatus

  // 右侧面板数据
  productionOverview: ProductionOverviewItem[]
  cameras: CameraInfo[]
}

// ===== 标题装饰属性 =====
export interface TitleDecorationProps {
  gradientId: string
  color?: 'cyan' | 'green' | 'red'
}

// ===== 视频卡片属性 =====
export interface VideoCardProps {
  camera: CameraInfo
  titleGradientId: string
  className?: string
}

// ===== 面板组件通用属性 =====
export interface PanelProps {
  className?: string
}

// ===== Header组件属性 =====
export interface HeaderProps {
  currentTime: Date
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

// ===== CenterPanel组件属性 =====
export interface CenterPanelProps {
  equipmentStatus: EquipmentStatus
  octagonBorderRef: React.RefObject<SVGSVGElement>
}

// ===== Scene3D组件属性 =====
export interface Scene3DProps {
  onLoadProgress?: (progress: number, text: string) => void
  onLoadComplete?: () => void
}

// ===== 视角控制组件属性 =====
export interface ViewPresetControlsProps {
  activePreset: ViewPresetKey
  onPresetChange: (preset: ViewPresetKey) => void
}

// ===== LeftPanel组件属性 =====
export interface LeftPanelProps {
  qualificationRate: QualificationRateData
  productQuality: ProductQualityData
  inventory: InventoryData
  exceptions: ProductionLineException[]
  alarms: AlarmRecord[]
}

// ===== RightPanel组件属性 =====
export interface RightPanelProps {
  productionOverview: ProductionOverviewItem[]
  cameras: CameraInfo[]
  period: '日' | '周' | '月'
  onPeriodChange: (period: '日' | '周' | '月') => void
}

// ===== ECharts图表配置类型 =====
export interface ChartGridConfig {
  left: string
  right: string
  top: string
  bottom: string
  containLabel?: boolean
}

export interface ChartAxisLabelConfig {
  show: boolean
  color: string
  fontSize: number
  formatter?: string | ((value: number) => string)
}

export interface ChartAxisConfig {
  type: 'category' | 'value'
  data?: string[]
  min?: number
  max?: number
  interval?: number
  axisLabel: ChartAxisLabelConfig
  axisLine: {
    lineStyle: {
      color: string
    }
  }
  splitLine?: {
    show: boolean
  }
}

// ===== 数据Hook返回类型 =====
export interface UseDigitalFactoryDataReturn {
  data: DigitalFactoryData | null
  loading: boolean
  error: Error | null
  refresh: () => void
  refetchProductionOverview: (period: '日' | '周' | '月') => Promise<void>
}
