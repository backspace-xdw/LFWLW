/**
 * 3D场景配置
 * 提取所有硬编码的配置参数
 */
import * as THREE from 'three'
import { ViewPresets, ModelConfig } from '../types'

// ===== 相机配置 =====
export const cameraConfig = {
  fov: 45,
  near: 0.1,
  far: 1000,
  initialPosition: { x: 0, y: 141, z: 141 },
  lookAt: { x: 0, y: 0, z: 0 },
}

// ===== 渲染器配置 =====
export const rendererConfig = {
  antialias: false,
  alpha: true,
  maxPixelRatio: 2,
  backgroundColor: 0x081a30,
}

// ===== 控制器配置 =====
export const controlsConfig = {
  enableDamping: true,
  dampingFactor: 0.08,
  autoRotate: false,
  // 垂直角度限制（俯仰角）
  minPolarAngle: Math.PI * 0.1, // 18°
  maxPolarAngle: Math.PI * 0.42, // 75°
  // 水平旋转不限制
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  // 平移设置
  enablePan: true,
  panSpeed: 1.15,
  screenSpacePanning: true,
  // 旋转速度
  rotateSpeed: 0.5,
  // 缩放设置
  enableZoom: true,
  zoomSpeed: 1.0,
  minDistance: 40,
  maxDistance: 260,
  // 平移范围限制
  panLimits: {
    x: 70,
    z: 70,
    y: { min: -10, max: 150 },
  },
  // 鼠标按键设置
  mouseButtons: {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  },
}

// ===== 视角预设 =====
export const viewPresets: ViewPresets = {
  overview: {
    name: '总览',
    position: new THREE.Vector3(80, 120, 80),
    target: new THREE.Vector3(0, 0, 0),
  },
  topView: {
    name: '俯视',
    position: new THREE.Vector3(0, 180, 0.1),
    target: new THREE.Vector3(0, 0, 0),
  },
  frontView: {
    name: '正面',
    position: new THREE.Vector3(0, 60, 150),
    target: new THREE.Vector3(0, 0, 0),
  },
  sideView: {
    name: '侧面',
    position: new THREE.Vector3(150, 60, 0),
    target: new THREE.Vector3(0, 0, 0),
  },
}

// ===== 视角切换动画配置 =====
export const viewAnimationConfig = {
  duration: 800, // 动画时长(ms)
}

// ===== 灯光配置 =====
export const lightingConfig = {
  hemisphere: {
    skyColor: 0x3ba7ff,
    groundColor: 0x0a1628,
    intensity: 0.55,
  },
  ambient: {
    color: 0x223a55,
    intensity: 0.35,
  },
  mainDirectional: {
    color: 0xfff2d7,
    intensity: 0.95,
    position: { x: 20, y: 40, z: 30 },
    shadow: {
      mapSize: 2048,
      cameraSize: 50,
    },
  },
  fillDirectional: {
    color: 0x36b0ff,
    intensity: 0.65,
    position: { x: -30, y: 20, z: -20 },
  },
  spotlights: [
    { position: [-30, 15, -15], color: 0x8fd6ff, intensity: 0.55, distance: 45 },
    { position: [0, 15, 0], color: 0x7bc4ff, intensity: 0.55, distance: 45 },
    { position: [25, 15, 0], color: 0xffcfa3, intensity: 0.55, distance: 45 },
  ],
}

// ===== 地板配置 =====
export const floorConfig = {
  width: 800,
  height: 600,
  color: 0x0a1f3a,
  positionY: 0,
}

// ===== 展示区域配置 =====
export const displayAreaConfig = {
  width: 240,
  height: 80,
  material: {
    color: 0x0d3c66,
    emissive: 0x1c75c1,
    emissiveIntensity: 0.35,
    roughness: 0.65,
    metalness: 0.1,
    opacity: 0.6,
  },
  position: { x: -8, y: 0.5, z: 0 },
}

// ===== 模型列表配置 =====
export const modelConfigs: ModelConfig[] = [
  {
    path: '/models/smarthouse2-v1.glb',
    scale: [0.96, 0.96, 0.96],
    position: [-92, 0.05, 0],
    rotation: [0, -Math.PI / 2, 0],
    modelKey: 'model1',
    label: '左侧工厂模型',
    primary: true,
  },
  {
    path: '/models/smarthouse1-v3.glb',
    scale: [0.96, 0.96, 0.96],
    position: [-12, 0.05, 0],
    rotation: [Math.PI, Math.PI / 2, 0],
    modelKey: 'model2',
    label: '右侧工厂模型',
    primary: true,
  },
  {
    path: '/models/duiduoji_new-v1.glb',
    scale: [0.96, 0.96, 0.96],
    position: [76, 0.05, 18],
    modelKey: 'model3',
    label: '堆垛机模型',
  },
  {
    path: '/models/duiduoji_new-v1-v1.glb',
    scale: [0.96, 0.96, 0.96],
    position: [76, 0.05, 2],
    modelKey: 'model4',
    label: '堆垛机2模型',
  },
  {
    path: '/models/tuopan1-v1.glb',
    scale: [2.4, 2.4, 2.4],
    position: [88, 0.05, 18],
    rotation: [Math.PI, 0, 0],
    modelKey: 'model5',
    label: '托盘模型',
  },
  {
    path: '/models/tuopan1-v1.glb',
    scale: [2.4, 2.4, 2.4],
    position: [88, 0.05, 2],
    rotation: [Math.PI, 0, 0],
    modelKey: 'model6',
    label: '托盘模型2',
  },
]

// ===== 模型总数 =====
export const TOTAL_MODELS = modelConfigs.length

// ===== 主要模型数（加载完成后即显示场景）=====
export const PRIMARY_MODELS = modelConfigs.filter(m => m.primary).length
