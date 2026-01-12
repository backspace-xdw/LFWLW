import React, { useEffect, useState, useRef } from 'react'
import { Card } from 'antd'
// useNavigate removed - not currently used
import ReactECharts from 'echarts-for-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore - Three.js类型定义可能不完整
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
// 设备模型暂未使用，使用GLB模型替代
// import {
//   createDetailedBoxOpener,
//   createDetailedMetalDetector,
//   createDetailedXRayInspector,
//   createDetailedCheckweigher,
//   createDetailedSlicer,
//   createDetailedPacker,
//   createDetailedPalletizer,
//   createDetailedLaminator,
//   createRealisticRollerConveyor,
//   createAlarmIndicator
// } from './EquipmentModels'
// API服务暂未实现，使用静态数据
// import { digitalFactoryService } from '@/services/digitalFactory'
import styles from './index.module.scss'
// import { PolygonBorder } from './PolygonBorder'

const DigitalFactory: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [productionOverviewPeriod, setProductionOverviewPeriod] = useState<'日' | '周' | '月'>('日')
  const mountRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const octagonBorderRef = useRef<SVGSVGElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const [activeViewPreset, setActiveViewPreset] = useState<string>('overview')
  const [maskPath, setMaskPath] = useState<string>('')
  const [maskViewBox, setMaskViewBox] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 })

  // 数据状态 - 使用静态数据（API暂未实现）
  const [productionOverviewData] = useState<any[]>([])

  // ===== 模型加载进度状态 =====
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('正在加载3D场景...')
  const modelLoadProgressRef = useRef<{ [key: string]: number }>({})

  // 更新总体加载进度
  const updateTotalProgress = () => {
    const progresses = Object.values(modelLoadProgressRef.current)
    if (progresses.length === 0) return
    const total = progresses.reduce((a, b) => a + b, 0)
    const avg = total / 6 // 6个模型
    setModelLoadingProgress(Math.min(avg, 100))
    if (avg >= 100) {
      setTimeout(() => {
        setIsModelLoading(false)
      }, 500)
    }
  }

  // ===== 预设视角配置 =====
  const viewPresets = {
    overview: {
      name: '总览',
      position: new THREE.Vector3(80, 120, 80),
      target: new THREE.Vector3(0, 0, 0)
    },
    topView: {
      name: '俯视',
      position: new THREE.Vector3(0, 180, 0.1),
      target: new THREE.Vector3(0, 0, 0)
    },
    frontView: {
      name: '正面',
      position: new THREE.Vector3(0, 60, 150),
      target: new THREE.Vector3(0, 0, 0)
    },
    sideView: {
      name: '侧面',
      position: new THREE.Vector3(150, 60, 0),
      target: new THREE.Vector3(0, 0, 0)
    }
  }

  // 切换预设视角（带平滑动画）
  const switchToPresetView = (presetKey: string) => {
    const preset = viewPresets[presetKey as keyof typeof viewPresets]
    if (!preset || !cameraRef.current || !controlsRef.current) return

    setActiveViewPreset(presetKey)

    const camera = cameraRef.current
    const controls = controlsRef.current

    // 当前位置
    const startPosition = camera.position.clone()
    const startTarget = controls.target.clone()

    // 目标位置
    const endPosition = preset.position.clone()
    const endTarget = preset.target.clone()

    // 动画参数
    const duration = 800 // 动画时长(ms)
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 缓动函数 (easeInOutCubic)
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      // 插值计算当前位置
      camera.position.lerpVectors(startPosition, endPosition, eased)
      controls.target.lerpVectors(startTarget, endTarget, eased)
      controls.update()

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }

  // 全屏切换功能
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // 进入全屏
      const container = containerRef.current
      if (container) {
        container.requestFullscreen().then(() => {
          setIsFullscreen(true)
        }).catch((err) => {
          console.error('无法进入全屏模式:', err)
        })
      }
    } else {
      // 退出全屏
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err) => {
        console.error('无法退出全屏模式:', err)
      })
    }
  }

  // 监听全屏变化事件（只监听页面容器的全屏状态，忽略视频全屏）
  useEffect(() => {
    const handleFullscreenChange = () => {
      // 只有当全屏元素是页面容器时才更新状态
      const isContainerFullscreen = document.fullscreenElement === containerRef.current
      setIsFullscreen(isContainerFullscreen)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Helper function to create text sprite - 暂未使用
  // const createTextSprite = (
  //   text: string,
  //   options: {
  //     fontSize?: number
  //     fontColor?: string
  //     backgroundColor?: string
  //     borderColor?: string
  //   } = {}
  // ) => {
  //   const {
  //     fontSize = 32,
  //     fontColor = '#ffffff',
  //     backgroundColor = 'rgba(0, 0, 0, 0.7)',
  //     borderColor = '#ffffff'
  //   } = options
  //
  //   const canvas = document.createElement('canvas')
  //   const context = canvas.getContext('2d')!
  //   canvas.width = 512
  //   canvas.height = 128
  //
  //   // Draw background
  //   context.fillStyle = backgroundColor
  //   context.fillRect(0, 0, canvas.width, canvas.height)
  //
  //   // Draw border
  //   context.strokeStyle = borderColor
  //   context.lineWidth = 4
  //   context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
  //
  //   // Draw text
  //   context.font = `bold ${fontSize}px Arial, sans-serif`
  //   context.fillStyle = fontColor
  //   context.textAlign = 'center'
  //   context.textBaseline = 'middle'
  //   context.fillText(text, canvas.width / 2, canvas.height / 2)
  //
  //   const texture = new THREE.CanvasTexture(canvas)
  //   const material = new THREE.SpriteMaterial({ map: texture })
  //   const sprite = new THREE.Sprite(material)
  //   sprite.scale.set(2, 0.5, 1)
  //
  //   return sprite
  // }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // API暂未实现，数据加载函数已禁用
  // 页面使用静态模拟数据展示

  // 初始加载 - 页面使用静态数据展示，无需调用API

  // 表格悬停暂停效果已通过CSS实现 (:hover { animation-play-state: paused; })

  // 根据八边形边框实际位置生成全屏遮罩路径，使八边形外的区域被遮罩
  useEffect(() => {
    const buildMask = () => {
      if (!mainContentRef.current || !octagonBorderRef.current) return
      const mainRect = mainContentRef.current.getBoundingClientRect()
      const octRect = octagonBorderRef.current.getBoundingClientRect()

      // octagonBorderSvg 的 viewBox 为 1000x1000，按实际渲染尺寸缩放并偏移
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

  // Initialize 3D scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const sceneBgColor = new THREE.Color(0x081a30)
    scene.background = sceneBgColor  // 深蓝背景
    // 关闭雾效，避免窗口缩小时展示区与3D模型被雾遮挡
    // scene.fog = new THREE.Fog(sceneBgColor, 120, 320)

    // Camera setup - 鸟瞰视角,类似图片中的俯视效果
    const camera = cameraRef.current = new THREE.PerspectiveCamera(
      45,  // 更小的FOV产生更少的透视变形
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 141, 141)  // 调整到距离200以内（约200单位）
    camera.lookAt(0, 0, 0)  // 看向场景中心

    // Renderer setup - 禁用阴影提高性能
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // 设置像素比，确保清晰显示
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setClearColor(sceneBgColor, 1)
    renderer.shadowMap.enabled = false  // 禁用阴影以提高性能
    mountRef.current.appendChild(renderer.domElement)

    // Controls (使用any类型绕过Three.js类型定义不完整的问题)
    const controls = controlsRef.current = new OrbitControls(camera, renderer.domElement) as any
    controls.enableDamping = true
    controls.dampingFactor = 0.08  // 增加阻尼，操作更平滑
    controls.autoRotate = false  // 禁用自动旋转

    // ===== 工业监控专用视角限制 =====
    // 垂直角度限制（俯仰角）- 保持俯视感，防止翻转
    controls.minPolarAngle = Math.PI * 0.1   // 18° - 最小俯角，保持俯视感
    controls.maxPolarAngle = Math.PI * 0.42  // 75° - 最大倾斜角，不会太水平

    // 水平旋转不限制，可360°查看整个工厂
    controls.minAzimuthAngle = -Infinity
    controls.maxAzimuthAngle = Infinity

    // 启用平移功能 - 可以拖拽移动场景中心
    controls.enablePan = true
    controls.panSpeed = 1.15
    controls.screenSpacePanning = true  // 屏幕空间平移，可拉出地板边缘

    // 鼠标按键设置：左键平移（拖拽），右键旋转，滚轮缩放
    // 这样可以用左键拖拽某个位置到中心，然后滚轮放大缩小
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,      // 左键拖拽平移
      MIDDLE: THREE.MOUSE.DOLLY,  // 中键缩放
      RIGHT: THREE.MOUSE.ROTATE   // 右键旋转
    }

    // 旋转速度优化 - 降低灵敏度，更精确控制
    controls.rotateSpeed = 0.5

    // 缩放设置
    controls.enableZoom = true
    controls.zoomSpeed = 1.0
    controls.minDistance = 40   // 最小缩放距离（避免过近）
    controls.maxDistance = 260  // 最大缩放距离（避免过远）

    // 限制平移范围，防止拖出地板区域
    const clampPan = () => {
      const limitX = 70
      const limitZ = 70
      const limitY = { min: -10, max: 150 }

      const clampedTarget = new THREE.Vector3(
        THREE.MathUtils.clamp(controls.target.x, -limitX, limitX),
        THREE.MathUtils.clamp(controls.target.y, limitY.min, limitY.max),
        THREE.MathUtils.clamp(controls.target.z, -limitZ, limitZ)
      )

      if (!clampedTarget.equals(controls.target)) {
        const offset = camera.position.clone().sub(controls.target)
        controls.target.copy(clampedTarget)
        camera.position.copy(clampedTarget.clone().add(offset))
      }
    }
    controls.addEventListener('change', clampPan)
    clampPan()

    // Enhanced Lighting - 工业环境照明
    const hemiLight = new THREE.HemisphereLight(0x3ba7ff, 0x0a1628, 0.55)
    scene.add(hemiLight)
    const ambientLight = new THREE.AmbientLight(0x223a55, 0.35)
    scene.add(ambientLight)

    // 主光源 - 模拟顶部工业照明
    const mainLight = new THREE.DirectionalLight(0xfff2d7, 0.95)
    mainLight.position.set(20, 40, 30)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.left = -50
    mainLight.shadow.camera.right = 50
    mainLight.shadow.camera.top = 50
    mainLight.shadow.camera.bottom = -50
    scene.add(mainLight)

    // 辅助光源
    const fillLight = new THREE.DirectionalLight(0x36b0ff, 0.65)
    fillLight.position.set(-30, 20, -20)
    scene.add(fillLight)

    // 点光源增强设备照明
    const spotlights = [
      { pos: [-30, 15, -15], color: 0x8fd6ff },
      { pos: [0, 15, 0], color: 0x7bc4ff },
      { pos: [25, 15, 0], color: 0xffcfa3 }
    ]

    spotlights.forEach(({ pos, color }) => {
      const light = new THREE.PointLight(color, 0.55, 45)
      light.position.set(pos[0], pos[1], pos[2])
      light.castShadow = false  // 关闭光源阴影投射
      scene.add(light)
    })

    // 创建地板
    const floorGeometry = new THREE.PlaneGeometry(800, 600)  // 宽800 x 高600，面积更大
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a1f3a,        // 深蓝色地板
      side: THREE.DoubleSide
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = false  // 关闭地面阴影接收
    scene.add(floor)

    // 创建展示区域 - 3D模型放置在此区域上（与页面配色一致）
    const displayAreaGeometry = new THREE.PlaneGeometry(240, 80)  // 宽240 x 深80（缩小0.8倍）
    const displayAreaMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d3c66,          // 深蓝基色
      emissive: 0x1c75c1,       // 冷色自发光，增强科技感
      emissiveIntensity: 0.35,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    })
    const displayArea = new THREE.Mesh(displayAreaGeometry, displayAreaMaterial)
    displayArea.rotation.x = -Math.PI / 2
    displayArea.position.set(-8, 0.5, 0)  // 居中显示在中间窗口（缩小0.8倍）
    scene.add(displayArea)

    // 配置DRACOLoader使用本地解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/') // 使用本地Draco解码器

    // 配置GLTFLoader
    const gltfLoader = new GLTFLoader()
    // @ts-ignore - Three.js类型定义不完整
    gltfLoader.setDRACOLoader(dracoLoader)

    // 并行加载左侧和右侧工厂GLB模型
    // 左侧模型（smarthouse2-v1）
    gltfLoader.load(
      '/models/smarthouse2-v1.glb',
      (gltf) => {
        const model = gltf.scene
        // 左侧模型位置（缩小0.8倍）
        model.scale.set(0.96, 0.96, 0.96)
        model.position.set(-92, 0.05, 0) // X=-92, Z=0（并排显示）
        model.rotation.y = -Math.PI / 2 // 反向旋转

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.side = THREE.DoubleSide
                })
              } else {
                child.material.side = THREE.DoubleSide
              }
            }
          }
        })

        scene.add(model)
        setLoadingText('左侧工厂模型加载完成')
        modelLoadProgressRef.current['model1'] = 100
        updateTotalProgress()
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100
          modelLoadProgressRef.current['model1'] = percent
          updateTotalProgress()
        }
      },
      (error) => {
        console.warn('左侧GLB模型加载失败:', error)
        modelLoadProgressRef.current['model1'] = 100 // 失败也标记完成
        updateTotalProgress()
      }
    )

    // 右侧模型（smarthouse1-v3）- 同时加载
    gltfLoader.load(
      '/models/smarthouse1-v3.glb',
      (gltf) => {
        const model = gltf.scene
        // 右侧模型位置（缩小0.8倍）
        model.scale.set(0.96, 0.96, 0.96)
        model.position.set(-12, 0.05, 0) // X=-12, Z=0（并排显示）
        model.rotation.set(Math.PI, Math.PI / 2, 0) // X轴180度翻转 + Y轴90度

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.side = THREE.DoubleSide
                })
              } else {
                child.material.side = THREE.DoubleSide
              }
            }
          }
        })

        scene.add(model)
        setLoadingText('右侧工厂模型加载完成')
        modelLoadProgressRef.current['model2'] = 100
        updateTotalProgress()
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100
          modelLoadProgressRef.current['model2'] = percent
          updateTotalProgress()
        }
      },
      (error) => {
        console.warn('右侧GLB模型加载失败:', error)
        modelLoadProgressRef.current['model2'] = 100
        updateTotalProgress()
      }
    )

    // 最右侧模型（duiduoji_new-v1）- 同时加载
    gltfLoader.load(
      '/models/duiduoji_new-v1.glb',
      (gltf) => {
        const model = gltf.scene
        // 最右侧模型位置（缩小0.8倍）
        model.scale.set(0.96, 0.96, 0.96)
        model.position.set(76, 0.05, 18) // X=76, Z=18（最右侧）

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.side = THREE.DoubleSide
                })
              } else {
                child.material.side = THREE.DoubleSide
              }
            }
          }
        })

        scene.add(model)
        setLoadingText('堆垛机模型加载完成')
        modelLoadProgressRef.current['model3'] = 100
        updateTotalProgress()
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100
          modelLoadProgressRef.current['model3'] = percent
          updateTotalProgress()
        }
      },
      (error) => {
        console.warn('最右侧GLB模型加载失败:', error)
        modelLoadProgressRef.current['model3'] = 100
        updateTotalProgress()
      }
    )

    // 最右侧模型2（duiduoji_new-v1-v1）- 同时加载
    gltfLoader.load(
      '/models/duiduoji_new-v1-v1.glb',
      (gltf) => {
        const model = gltf.scene
        // 与duiduoji_new-v1并排显示（缩小0.8倍）
        model.scale.set(0.96, 0.96, 0.96)
        model.position.set(76, 0.05, 2) // X=76, Z=2（与duiduoji_new-v1前后排列）

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.side = THREE.DoubleSide
                })
              } else {
                child.material.side = THREE.DoubleSide
              }
            }
          }
        })

        scene.add(model)
        setLoadingText('堆垛机2模型加载完成')
        modelLoadProgressRef.current['model4'] = 100
        updateTotalProgress()
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100
          modelLoadProgressRef.current['model4'] = percent
          updateTotalProgress()
        }
      },
      (error) => {
        console.warn('最右侧GLB模型2加载失败:', error)
        modelLoadProgressRef.current['model4'] = 100
        updateTotalProgress()
      }
    )

    // 托盘模型（tuopan1-v1）- 堆垛机右侧（缩小0.8倍）
    gltfLoader.load(
      '/models/tuopan1-v1.glb',
      (gltf) => {
        const model = gltf.scene
        model.scale.set(2.4, 2.4, 2.4) // 放大模型（缩小0.8倍）
        model.position.set(88, 0.05, 18) // X=88, Z=18
        model.rotation.x = Math.PI // 上下颠倒

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.side = THREE.DoubleSide
                })
              } else {
                child.material.side = THREE.DoubleSide
              }
            }
          }
        })

        scene.add(model)
        setLoadingText('托盘模型加载完成')
        modelLoadProgressRef.current['model5'] = 100
        updateTotalProgress()
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100
          modelLoadProgressRef.current['model5'] = percent
          updateTotalProgress()
        }
      },
      (error) => {
        console.warn('托盘模型加载失败:', error)
        modelLoadProgressRef.current['model5'] = 100
        updateTotalProgress()
      }
    )

    // 托盘模型2（tuopan1-v1）- duiduoji_new-v1-v1右侧（缩小0.8倍）
    gltfLoader.load(
      '/models/tuopan1-v1.glb',
      (gltf) => {
        const model = gltf.scene
        model.scale.set(2.4, 2.4, 2.4) // 放大模型（缩小0.8倍）
        model.position.set(88, 0.05, 2) // X=88, Z=2
        model.rotation.x = Math.PI // 上下颠倒

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.side = THREE.DoubleSide
                })
              } else {
                child.material.side = THREE.DoubleSide
              }
            }
          }
        })

        scene.add(model)
        setLoadingText('场景加载完成')
        modelLoadProgressRef.current['model6'] = 100
        updateTotalProgress()
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100
          modelLoadProgressRef.current['model6'] = percent
          updateTotalProgress()
        }
      },
      (error) => {
        console.warn('托盘模型2加载失败:', error)
        modelLoadProgressRef.current['model6'] = 100
        updateTotalProgress()
      }
    )

    // Grid - 已移除网格线以获得更清爽的视觉效果
    // const gridHelper = new THREE.GridHelper(120, 30, 0x3498db, 0x34495e)
    // gridHelper.material.opacity = 0.25
    // gridHelper.material.transparent = true
    // scene.add(gridHelper)

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()

      // 告警灯闪烁动画
      const time = Date.now() * 0.003
      scene.traverse((obj) => {
        if ((obj as any).isAlarmActive) {
          const intensity = Math.sin(time * 3) * 0.5 + 0.5 // 0-1之间闪烁
          if ((obj as any).alarmLight) {
            (obj as any).alarmLight.material.emissiveIntensity = 2 + intensity * 2
          }
          if ((obj as any).alarmPointLight) {
            (obj as any).alarmPointLight.intensity = 1 + intensity * 1.5
          }
        }
      })

      // 机器人手臂动画已禁用
      // if ((window as any).__robotArmAnimate) {
      //   (window as any).__robotArmAnimate.update()
      // }

      // 执行所有注册的动画函数（包括其他动画）
      const animationLoop = (window as any).__threeAnimationLoop
      if (animationLoop && Array.isArray(animationLoop)) {
        animationLoop.forEach((animFunc: () => void) => animFunc())
      }

      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight

      // 确保尺寸有效
      if (width > 0 && height > 0) {
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
        console.log(`3D场景尺寸更新: ${width}x${height}`)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      controls.removeEventListener('change', clampPan)
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // 设备运行数据 - 备用数据，暂未使用
  // const deviceStats = {
  //   total: 99,
  //   running: 95,
  //   maintenance: 3,
  //   fault: 1,
  //   utilization: 96.2,
  // }

  // 产品合格率数据 - 备用数据，暂未使用
  // const processData = {
  //   name: '主流程',
  //   type: 'MA3002',
  //   count: 34000,
  //   efficiency: '92.3%',
  //   duration: '2023.3.1',
  //   status: '1232单',
  // }

  // 仓库存料数据 - 备用数据，暂未使用
  // const personnelData = {
  //   attendance: '100%',
  //   onDuty: 123,
  //   workers: 98,
  //   engineers: 25,
  //   management: 8,
  // }

  // 产线异常信息数据 - 备用数据，暂未使用
  // const energyTrendData = [
  //   { date: '08/01', 生产能耗: 35, 计划能耗: 45, 社会能耗: 25 },
  //   { date: '08/02', 生产能耗: 42, 计划能耗: 48, 社会能耗: 28 },
  //   { date: '08/03', 生产能耗: 38, 计划能耗: 46, 社会能耗: 26 },
  //   { date: '08/04', 生产能耗: 45, 计划能耗: 50, 社会能耗: 30 },
  //   { date: '08/05', 生产能耗: 40, 计划能耗: 47, 社会能耗: 27 },
  //   { date: '08/06', 生产能耗: 48, 计划能耗: 52, 社会能耗: 32 },
  //   { date: '08/07', 生产能耗: 43, 计划能耗: 49, 社会能耗: 29 },
  //   { date: '08/08', 生产能耗: 46, 计划能耗: 51, 社会能耗: 31 },
  // ]

  // 7天能耗趋势数据 - 备用数据，暂未使用
  // const weeklyEnergyData = [
  //   { date: '03/10', value: 45 },
  //   { date: '03/11', value: 52 },
  //   { date: '03/12', value: 48 },
  //   { date: '03/13', value: 55 },
  //   { date: '03/14', value: 50 },
  //   { date: '03/15', value: 58 },
  //   { date: '03/16', value: 53 },
  // ]

  // 产量完成概览数据 - 使用API数据或默认值
  const productionOverview = productionOverviewData.length > 0 ? productionOverviewData : [
    { name: '产品A', plan: 1007, actual: 907, completion: 20 },
    { name: '产品B', plan: 1007, actual: 907, completion: 40 },
  ]

  // 区域传感器概览 - 备用数据，暂未使用
  // const sensorStatus = [
  //   { name: '测油温度', status: 'normal', value: 0.3 },
  //   { name: '温度', status: 'warning', value: 0.2 },
  //   { name: '电流', status: 'normal', value: 0.1 },
  //   { name: '电压', status: 'normal', value: 0.15 },
  //   { name: '功率消耗', status: 'normal', value: 0.25 },
  // ]

  // 实时监测趋势 - 备用数据，暂未使用
  // const realtimeData = Array.from({ length: 20 }, (_, i) => ({
  //   time: `0:00:${i.toString().padStart(2, '0')}`,
  //   测油温度: Math.sin(i * 0.5) * 0.1 + 0.15,
  //   温度: Math.cos(i * 0.5) * 0.1 + 0.1,
  //   电流: Math.sin(i * 0.3 + 1) * 0.08 + 0.12,
  //   电压: Math.cos(i * 0.4 + 2) * 0.09 + 0.11,
  // }))

  // 7天能耗趋势（右侧） - 备用数据，暂未使用
  // const weeklyPowerData = Array.from({ length: 7 }, (_, i) => {
  //   const baseValues = [120, 150, 180, 160, 190, 170, 200]
  //   return {
  //     date: `04-${(11 + i).toString().padStart(2, '0')}`,
  //     value: baseValues[i % baseValues.length] + Math.random() * 50,
  //   }
  // })

  // Chart configs - 备用配置，暂未使用（使用ECharts替代）
  // const energyLineConfig = {
  //   data: energyTrendData.flatMap(item => [
  //     { date: item.date, type: '生产能耗', value: item.生产能耗 },
  //     { date: item.date, type: '计划能耗', value: item.计划能耗 },
  //     { date: item.date, type: '社会能耗', value: item.社会能耗 },
  //   ]),
  //   xField: 'date',
  //   yField: 'value',
  //   seriesField: 'type',
  //   smooth: true,
  //   animation: {
  //     appear: {
  //       animation: 'path-in',
  //       duration: 1000,
  //     },
  //   },
  //   color: ['#1890ff', '#52c41a', '#faad14'],
  // }

  // const weeklyEnergyConfig = {
  //   data: weeklyEnergyData,
  //   xField: 'date',
  //   yField: 'value',
  //   smooth: true,
  //   areaStyle: {
  //     fill: 'l(270) 0:#1890ff 1:#141414',
  //   },
  //   line: {
  //     color: '#1890ff',
  //   },
  // }

  // const realtimeConfig = {
  //   data: realtimeData.flatMap(item => [
  //     { time: item.time, type: '测油温度', value: item.测油温度 },
  //     { time: item.time, type: '温度', value: item.温度 },
  //     { time: item.time, type: '电流', value: item.电流 },
  //     { time: item.time, type: '电压', value: item.电压 },
  //   ]),
  //   xField: 'time',
  //   yField: 'value',
  //   seriesField: 'type',
  //   smooth: true,
  //   animation: {
  //     appear: {
  //       animation: 'wave-in',
  //       duration: 1000,
  //     },
  //   },
  //   color: ['#52c41a', '#faad14', '#1890ff', '#722ed1'],
  // }

  // const weeklyPowerConfig = {
  //   data: weeklyPowerData,
  //   xField: 'date',
  //   yField: 'value',
  //   columnStyle: {
  //     fill: 'l(270) 0:#1890ff 0.5:#36cfc9 1:#52c41a',
  //   },
  // }

  return (
    <div ref={containerRef} className={`${styles.digitalFactory} ${isFullscreen ? styles.fullscreenMode : ''}`}>
      {/* 顶部标题栏 - BigDataView风格（简洁版）*/}
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
            <div className={styles.datetime}>
              {currentTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
            <div className={styles.fullscreenButton} onClick={toggleFullscreen} title={isFullscreen ? '退出全屏' : '全屏显示'}>
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className={styles.mainContent} ref={mainContentRef}>
        {/* 3D场景作为全局背景 */}
        <div className={styles.scene3dBackground} ref={mountRef}></div>

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
              <div className={styles.progressText}>{Math.round(modelLoadingProgress)}%</div>
            </div>
          </div>
        )}

        {/* 预设视角控制按钮 */}
        <div className={styles.viewPresetPanel}>
          <div className={styles.viewPresetTitle}>视角切换</div>
          <div className={styles.viewPresetButtons}>
            {Object.entries(viewPresets).map(([key, preset]) => (
              <button
                key={key}
                className={`${styles.viewPresetBtn} ${activeViewPreset === key ? styles.active : ''}`}
                onClick={() => switchToPresetView(key)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className={styles.viewPresetTip}>
            右键拖拽旋转 | 左键拖拽平移 | 滚轮缩放
          </div>
        </div>

        {/* 全屏遮罩：动态镂空八边形，其余区域半透明遮盖 */}
        {maskPath && (
          <svg
            className={styles.fullScreenMaskSvg}
            viewBox={`0 0 ${maskViewBox.width} ${maskViewBox.height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="octagonFeatherSoft" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="24" />
              </filter>
              <filter id="octagonFeatherWide" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="46" />
              </filter>
              <linearGradient id="maskFadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
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
                {/* 中心孔位：完全透明 */}
                <path d={maskPath} fill="black" />
                {/* 羽化边缘：多层次模糊描边，靠近八边形逐步减弱遮罩 */}
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
            <rect x="0" y="0" width="100%" height="100%" fill="url(#maskFadeGradient)" mask="url(#octagonWindowMask)" />
          </svg>
        )}

        {/* 左侧面板 */}
        <div className={styles.leftPanel}>
          {/* 本日工序合格率 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%' }}>本日工序合格率</div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            }
            variant="borderless">
            <ReactECharts
              option={{
                grid: {
                  left: '10%',
                  right: '20%',
                  top: '15%',
                  bottom: '20%',
                },
                xAxis: {
                  type: 'category',
                  data: ['安检人数', '不合格人数'],
                  axisLabel: {
                    show: true,
                    color: '#ffffff',
                    fontSize: 10,
                  },
                  axisLine: {
                    lineStyle: {
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                },
                yAxis: {
                  type: 'value',
                  min: 0,
                  max: 1000,
                  interval: 200,
                  axisLabel: {
                    show: true,
                    color: '#ffffff',
                    fontSize: 8,
                  },
                  axisLine: {
                    lineStyle: {
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                  splitLine: {
                    show: false,
                  },
                },
                series: [
                  {
                    name: '山形柱状图',
                    type: 'pictorialBar',
                    symbol: 'path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C4.5,5 4.5,10 0,10 z',
                    data: [800, 200],
                    symbolRepeat: false,
                    symbolClip: true,
                    symbolSize: ['60%', '100%'],
                    itemStyle: {
                      color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                          { offset: 0, color: '#00e2cf' },
                          { offset: 0.5, color: '#00b3a6' },
                          { offset: 1, color: '#0c1f55' },
                        ],
                      },
                    },
                    label: {
                      show: true,
                      position: 'top',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 'bold',
                    },
                    z: 10,
                  },
                ],
              }}
              style={{ height: '120px' }}
            />
          </Card>

          {/* 产品合格率 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%' }}>产品合格率</div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient3)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            }
            variant="borderless"
          >
            <ReactECharts
              option={{
                grid: {
                  left: '10%',
                  right: '10%',
                  top: '25%',
                  bottom: '15%',
                },
                title: {
                  text: '本日合格率',
                  top: 0,
                  left: 0,
                  textStyle: {
                    color: '#ffffff',
                    fontSize: 9,
                    fontWeight: 'normal',
                  },
                },
                xAxis: {
                  type: 'category',
                  data: ['10/01', '10/02', '10/03', '10/04', '10/05'],
                  axisLabel: {
                    show: true,
                    color: '#ffffff',
                    fontSize: 8,
                  },
                  axisLine: {
                    lineStyle: {
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                },
                yAxis: [
                  {
                    type: 'value',
                    min: 0,
                    max: 500,
                    interval: 100,
                    axisLabel: {
                      show: true,
                      color: '#ffffff',
                      fontSize: 8,
                    },
                    axisLine: {
                      lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                    },
                    splitLine: {
                      show: false,
                    },
                  },
                  {
                    type: 'value',
                    min: 0,
                    max: 100,
                    interval: 20,
                    axisLabel: {
                      show: true,
                      color: '#ffffff',
                      fontSize: 8,
                      formatter: '{value}%',
                    },
                    axisLine: {
                      lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)',
                      },
                    },
                    splitLine: {
                      show: false,
                    },
                  },
                ],
                series: [
                  {
                    name: '合格率',
                    type: 'line',
                    data: [420, 380, 450, 400, 460],
                    smooth: true,
                    lineStyle: {
                      width: 2,
                      color: '#00e2cf',
                    },
                    itemStyle: {
                      color: '#00e2cf',
                    },
                    areaStyle: {
                      color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                          { offset: 0, color: 'rgba(0, 226, 207, 0.3)' },
                          { offset: 1, color: 'rgba(12, 31, 85, 0.1)' },
                        ],
                      },
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    label: {
                      show: true,
                      position: 'top',
                      color: '#ffffff',
                      fontSize: 8,
                    },
                  },
                ],
              }}
              style={{ height: '100px' }}
            />
          </Card>

          {/* 仓库存料 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%' }}>仓库存料</div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient4)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            }
            variant="borderless"
          >
            <ReactECharts
              option={{
                grid: {
                  left: '3%',
                  right: '10%',
                  top: '12%',
                  bottom: '5%',
                  containLabel: true,
                },
                xAxis: {
                  type: 'value',
                  min: 0,
                  max: 1000,
                  interval: 200,
                  axisLabel: {
                    show: true,
                    color: '#ffffff',
                    fontSize: 8,
                  },
                  axisLine: {
                    lineStyle: {
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                  splitLine: {
                    show: false,
                  },
                },
                yAxis: {
                  type: 'category',
                  data: ['2020', '2021', '2022', '2023', '2024', '2025'],
                  axisLabel: {
                    show: true,
                    color: '#ffffff',
                    fontSize: 8,
                  },
                  axisLine: {
                    lineStyle: {
                      color: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                },
                series: [
                  {
                    name: '库存量',
                    type: 'bar',
                    data: [
                      650,
                      780,
                      520,
                      880,
                      750,
                      {
                        value: 400,
                        itemStyle: {
                          color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                              { offset: 0, color: 'rgba(12, 31, 85, 0.3)' },
                              { offset: 0.5, color: 'rgba(0, 226, 207, 0.4)' },
                              { offset: 1, color: 'rgba(0, 226, 207, 0.6)' },
                            ],
                          },
                        },
                      }
                    ],
                    barWidth: 10,
                    itemStyle: {
                      color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [
                          { offset: 0, color: '#0c1f55' },
                          { offset: 1, color: '#00e2cf' },
                        ],
                      },
                    },
                    label: {
                      show: false,
                    },
                  },
                  {
                    name: '顶部装饰',
                    type: 'pictorialBar',
                    data: [
                      { value: 650, symbolSize: [10, 10] },
                      { value: 780, symbolSize: [10, 10] },
                      { value: 520, symbolSize: [10, 10] },
                      { value: 880, symbolSize: [10, 10] },
                      { value: 750, symbolSize: [10, 10] },
                      { value: 400, symbolSize: [10, 10] },
                    ],
                    symbolPosition: 'end',
                    symbol: 'diamond',
                    symbolOffset: ['50%', 0],
                    itemStyle: {
                      color: '#6dfff3',
                    },
                    z: 3,
                  },
                ],
              }}
              style={{ height: '100px' }}
            />
          </Card>

          {/* 产线异常信息 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%' }}>产线异常信息</div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient7" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient7)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            }
            variant="borderless"
          >
            <div className={styles.exceptionTableContainer} ref={tableScrollRef}>
              <table className={styles.exceptionTable}>
                <thead>
                  <tr>
                    <th>年份</th>
                    <th>产值</th>
                    <th>人均产值</th>
                    <th>员工人数</th>
                  </tr>
                </thead>
              </table>
              <div className={styles.scrollWrapper}>
                <table className={styles.exceptionTable}>
                <tbody>
                  {/* 第一份数据 */}
                  <tr>
                    <td>2025</td>
                    <td>30亿</td>
                    <td>1000</td>
                    <td>1万</td>
                  </tr>
                  <tr>
                    <td>2024</td>
                    <td>40亿</td>
                    <td>1200</td>
                    <td>2万</td>
                  </tr>
                  <tr>
                    <td>2023</td>
                    <td>35亿</td>
                    <td>1100</td>
                    <td>1.5万</td>
                  </tr>
                  <tr>
                    <td>2022</td>
                    <td>32亿</td>
                    <td>1050</td>
                    <td>1.2万</td>
                  </tr>
                  <tr>
                    <td>2021</td>
                    <td>28亿</td>
                    <td>950</td>
                    <td>1.1万</td>
                  </tr>
                  <tr>
                    <td>2020</td>
                    <td>25亿</td>
                    <td>900</td>
                    <td>1万</td>
                  </tr>
                  <tr>
                    <td>2019</td>
                    <td>22亿</td>
                    <td>850</td>
                    <td>0.9万</td>
                  </tr>
                  <tr>
                    <td>2018</td>
                    <td>20亿</td>
                    <td>800</td>
                    <td>0.8万</td>
                  </tr>
                  {/* 第二份数据（复制）- 用于无缝循环 */}
                  <tr>
                    <td>2025</td>
                    <td>30亿</td>
                    <td>1000</td>
                    <td>1万</td>
                  </tr>
                  <tr>
                    <td>2024</td>
                    <td>40亿</td>
                    <td>1200</td>
                    <td>2万</td>
                  </tr>
                  <tr>
                    <td>2023</td>
                    <td>35亿</td>
                    <td>1100</td>
                    <td>1.5万</td>
                  </tr>
                  <tr>
                    <td>2022</td>
                    <td>32亿</td>
                    <td>1050</td>
                    <td>1.2万</td>
                  </tr>
                  <tr>
                    <td>2021</td>
                    <td>28亿</td>
                    <td>950</td>
                    <td>1.1万</td>
                  </tr>
                  <tr>
                    <td>2020</td>
                    <td>25亿</td>
                    <td>900</td>
                    <td>1万</td>
                  </tr>
                  <tr>
                    <td>2019</td>
                    <td>22亿</td>
                    <td>850</td>
                    <td>0.9万</td>
                  </tr>
                  <tr>
                    <td>2018</td>
                    <td>20亿</td>
                    <td>800</td>
                    <td>0.8万</td>
                  </tr>
                  {/* 第三份数据（复制）- 用于无缝循环 */}
                  <tr>
                    <td>2025</td>
                    <td>30亿</td>
                    <td>1000</td>
                    <td>1万</td>
                  </tr>
                  <tr>
                    <td>2024</td>
                    <td>40亿</td>
                    <td>1200</td>
                    <td>2万</td>
                  </tr>
                  <tr>
                    <td>2023</td>
                    <td>35亿</td>
                    <td>1100</td>
                    <td>1.5万</td>
                  </tr>
                  <tr>
                    <td>2022</td>
                    <td>32亿</td>
                    <td>1050</td>
                    <td>1.2万</td>
                  </tr>
                  <tr>
                    <td>2021</td>
                    <td>28亿</td>
                    <td>950</td>
                    <td>1.1万</td>
                  </tr>
                  <tr>
                    <td>2020</td>
                    <td>25亿</td>
                    <td>900</td>
                    <td>1万</td>
                  </tr>
                  <tr>
                    <td>2019</td>
                    <td>22亿</td>
                    <td>850</td>
                    <td>0.9万</td>
                  </tr>
                  <tr>
                    <td>2018</td>
                    <td>20亿</td>
                    <td>800</td>
                    <td>0.8万</td>
                  </tr>
                </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* 设备报警 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%' }}>设备报警</div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient8" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(255, 100, 100, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(255, 100, 100, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(255, 120, 120, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(255, 100, 100, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(255, 100, 100, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient8)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            }
            variant="borderless"
          >
            <div className={styles.exceptionTableContainer}>
              <table className={styles.alarmTable}>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>设备</th>
                    <th>等级</th>
                    <th>报警内容</th>
                  </tr>
                </thead>
              </table>
              <div className={styles.alarmScrollWrapper}>
                <table className={styles.alarmTable}>
                  <tbody>
                    {/* 模拟报警数据 - 第一份 */}
                    <tr>
                      <td>22:41:05</td>
                      <td>1#压缩机</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>温度超限 85.2°C</td>
                    </tr>
                    <tr>
                      <td>22:38:22</td>
                      <td>3#传送带</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>运行速度异常</td>
                    </tr>
                    <tr>
                      <td>22:35:18</td>
                      <td>2#泵站</td>
                      <td><span className={styles.alarmLevelLow}>低</span></td>
                      <td>流量波动 ±5%</td>
                    </tr>
                    <tr>
                      <td>22:30:45</td>
                      <td>5#阀门</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>压力异常 12.5MPa</td>
                    </tr>
                    <tr>
                      <td>22:28:10</td>
                      <td>4#电机</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>电流过载 125A</td>
                    </tr>
                    <tr>
                      <td>22:25:33</td>
                      <td>1#储罐</td>
                      <td><span className={styles.alarmLevelLow}>低</span></td>
                      <td>液位低于设定值</td>
                    </tr>
                    <tr>
                      <td>22:20:15</td>
                      <td>6#风机</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>振动超标 8.5mm/s</td>
                    </tr>
                    <tr>
                      <td>22:15:42</td>
                      <td>2#换热器</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>效率下降 15%</td>
                    </tr>
                    {/* 模拟报警数据 - 第二份（复制用于无缝滚动） */}
                    <tr>
                      <td>22:41:05</td>
                      <td>1#压缩机</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>温度超限 85.2°C</td>
                    </tr>
                    <tr>
                      <td>22:38:22</td>
                      <td>3#传送带</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>运行速度异常</td>
                    </tr>
                    <tr>
                      <td>22:35:18</td>
                      <td>2#泵站</td>
                      <td><span className={styles.alarmLevelLow}>低</span></td>
                      <td>流量波动 ±5%</td>
                    </tr>
                    <tr>
                      <td>22:30:45</td>
                      <td>5#阀门</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>压力异常 12.5MPa</td>
                    </tr>
                    <tr>
                      <td>22:28:10</td>
                      <td>4#电机</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>电流过载 125A</td>
                    </tr>
                    <tr>
                      <td>22:25:33</td>
                      <td>1#储罐</td>
                      <td><span className={styles.alarmLevelLow}>低</span></td>
                      <td>液位低于设定值</td>
                    </tr>
                    <tr>
                      <td>22:20:15</td>
                      <td>6#风机</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>振动超标 8.5mm/s</td>
                    </tr>
                    <tr>
                      <td>22:15:42</td>
                      <td>2#换热器</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>效率下降 15%</td>
                    </tr>
                    {/* 模拟报警数据 - 第三份（复制用于无缝滚动） */}
                    <tr>
                      <td>22:41:05</td>
                      <td>1#压缩机</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>温度超限 85.2°C</td>
                    </tr>
                    <tr>
                      <td>22:38:22</td>
                      <td>3#传送带</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>运行速度异常</td>
                    </tr>
                    <tr>
                      <td>22:35:18</td>
                      <td>2#泵站</td>
                      <td><span className={styles.alarmLevelLow}>低</span></td>
                      <td>流量波动 ±5%</td>
                    </tr>
                    <tr>
                      <td>22:30:45</td>
                      <td>5#阀门</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>压力异常 12.5MPa</td>
                    </tr>
                    <tr>
                      <td>22:28:10</td>
                      <td>4#电机</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>电流过载 125A</td>
                    </tr>
                    <tr>
                      <td>22:25:33</td>
                      <td>1#储罐</td>
                      <td><span className={styles.alarmLevelLow}>低</span></td>
                      <td>液位低于设定值</td>
                    </tr>
                    <tr>
                      <td>22:20:15</td>
                      <td>6#风机</td>
                      <td><span className={styles.alarmLevelHigh}>高</span></td>
                      <td>振动超标 8.5mm/s</td>
                    </tr>
                    <tr>
                      <td>22:15:42</td>
                      <td>2#换热器</td>
                      <td><span className={styles.alarmLevelMedium}>中</span></td>
                      <td>效率下降 15%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* 中间面板 - 原3D场景已移至背景层 */}
        <div className={styles.centerPanel}>
          {/* 八边形边框 - 使用SVG绘制，模仿PNG样式 */}
          <svg
            className={styles.octagonBorderSvg}
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            ref={octagonBorderRef}
          >
            <defs>
              {/* 白色渐变流光效果 */}
              <linearGradient id="flowGradientColor" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                <stop offset="10%" style={{ stopColor: '#ffffff', stopOpacity: 0.1 }} />
                <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
                <stop offset="90%" style={{ stopColor: '#ffffff', stopOpacity: 0.1 }} />
                <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
              </linearGradient>

              {/* 流光滤镜 */}
              <filter id="reflectionGlow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="2 0 0 0 0  0 2 0 0 0  0 0 2 0 0  0 0 0 2.5 0" result="bright"/>
                <feMerge>
                  <feMergeNode in="bright"/>
                  <feMergeNode in="SourceGraphic"/>
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
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* 背景填充 - 八边形内部亮蓝色调,与外侧形成强烈对比 */}
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

            {/* 外层边框 - 深蓝色八边形，8条边带圆角 */}
            <path
              d="M 351 50 L 691 50 Q 731 50 761 80 L 876 195 Q 911 230 911 270 L 911 680 Q 911 720 876 755 L 761 870 Q 731 900 691 900 L 351 900 Q 311 900 281 870 L 166 755 Q 131 720 131 680 L 131 270 Q 131 230 166 195 L 281 80 Q 311 50 351 50 Z"
              fill="none"
              stroke="url(#outerBorderGradient)"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* 内层边框 - 浅蓝色八边形，8条边带圆角 */}
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
              <span className={styles.labelLeft}>总数: 23台</span>
              <span className={styles.labelCenter}>开机: 20台</span>
              <span className={styles.labelRight}>未运行: 3台</span>
            </div>
            <div className={styles.progressBarWrapper}>
              <svg width="100%" height="100%" viewBox="0 0 100 10" preserveAspectRatio="none">
                {/* 进度条背景 - 平行四边形 */}
                <polygon
                  points="2,3 100,3 98,7 0,7"
                  fill="rgba(0, 100, 200, 0.15)"
                />
                {/* 进度条前景 - 平行四边形 */}
                <polygon
                  points="2,3 87,3 85.26,7 0,7"
                  fill="#2196f3"
                />
                {/* 橙色端点 - 平行四边形 */}
                <polygon
                  points="85,2 87.5,2 85.76,8 83.26,8"
                  fill="#ff8800"
                >
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
                </polygon>
              </svg>
            </div>
          </div>

          {/* 底部设备状态栏 - 已隐藏 */}
          {/* <div className={styles.equipmentStatusBar}>
            <div className={`${styles.statusItem} ${styles.total}`}>
              <span className={styles.statusLabel}>总数:</span>
              <span className={styles.statusValue}>23</span>
              <span className={styles.statusLabel}>台</span>
            </div>
            <div className={`${styles.statusItem} ${styles.running}`}>
              <span className={styles.statusLabel}>开机:</span>
              <span className={styles.statusValue}>20</span>
              <span className={styles.statusLabel}>台</span>
            </div>
            <div className={`${styles.statusItem} ${styles.stopped}`}>
              <span className={styles.statusLabel}>未运行:</span>
              <span className={styles.statusValue}>3</span>
              <span className={styles.statusLabel}>台</span>
            </div>
          </div> */}
        </div>

        {/* 右侧面板 */}
        <div className={styles.rightPanel}>
          {/* 产量完成概览 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ position: 'relative', paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ paddingLeft: '5%' }}>产量完成概览</div>
                  <div className={styles.trendButtons}>
                    <button
                      className={productionOverviewPeriod === '日' ? styles.active : ''}
                      onClick={() => setProductionOverviewPeriod('日')}
                    >
                      本日
                    </button>
                    <button
                      className={productionOverviewPeriod === '周' ? styles.active : ''}
                      onClick={() => setProductionOverviewPeriod('周')}
                    >
                      本周
                    </button>
                    <button
                      className={productionOverviewPeriod === '月' ? styles.active : ''}
                      onClick={() => setProductionOverviewPeriod('月')}
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
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
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

          {/* 实时监控1 - 生产车间 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.liveIndicator}></span>
                  生产车间监控
                </div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient5" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 255, 170, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient5)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
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
                  poster="/images/video-poster-1.jpg"
                >
                  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                  您的浏览器不支持视频播放
                </video>
                <div className={styles.videoOverlay}>
                  <div className={styles.videoInfo}>
                    <span className={styles.cameraName}>CAM-01</span>
                    <span className={styles.cameraLocation}>1号生产线</span>
                  </div>
                  <div className={styles.videoControls}>
                    <button className={styles.videoBtn} title="全屏" onClick={(e) => {
                      const video = e.currentTarget.closest(`.${styles.videoWrapper}`)?.querySelector('video')
                      if (video) video.requestFullscreen?.()
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 实时监控2 - 仓储区域 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.liveIndicator}></span>
                  仓储区域监控
                </div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient6" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 255, 170, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient6)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
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
                  poster="/images/video-poster-2.jpg"
                >
                  <source src="https://www.w3schools.com/html/movie.mp4" type="video/mp4" />
                  您的浏览器不支持视频播放
                </video>
                <div className={styles.videoOverlay}>
                  <div className={styles.videoInfo}>
                    <span className={styles.cameraName}>CAM-02</span>
                    <span className={styles.cameraLocation}>仓储中心</span>
                  </div>
                  <div className={styles.videoControls}>
                    <button className={styles.videoBtn} title="全屏" onClick={(e) => {
                      const video = e.currentTarget.closest(`.${styles.videoWrapper}`)?.querySelector('video')
                      if (video) video.requestFullscreen?.()
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 实时监控3 - 装配车间 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.liveIndicator}></span>
                  装配车间监控
                </div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient9" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 255, 170, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient9)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
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
                  poster="/images/video-poster-3.jpg"
                >
                  <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
                  您的浏览器不支持视频播放
                </video>
                <div className={styles.videoOverlay}>
                  <div className={styles.videoInfo}>
                    <span className={styles.cameraName}>CAM-03</span>
                    <span className={styles.cameraLocation}>2号装配线</span>
                  </div>
                  <div className={styles.videoControls}>
                    <button className={styles.videoBtn} title="全屏" onClick={(e) => {
                      const video = e.currentTarget.closest(`.${styles.videoWrapper}`)?.querySelector('video')
                      if (video) video.requestFullscreen?.()
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 实时监控4 - 质检中心 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.liveIndicator}></span>
                  质检中心监控
                </div>
                <svg
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '-35px',
                    pointerEvents: 'none'
                  }}
                  viewBox="0 -35 100 43"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="titleLineGradient10" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 255, 170, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 255, 136, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 255, 136, 0)', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M -5 -35 Q -15 -10 5 4 L 100 4"
                    stroke="url(#titleLineGradient10)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
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
                  poster="/images/video-poster-4.jpg"
                >
                  <source src="https://samplelib.com/lib/preview/mp4/sample-5s.mp4" type="video/mp4" />
                  您的浏览器不支持视频播放
                </video>
                <div className={styles.videoOverlay}>
                  <div className={styles.videoInfo}>
                    <span className={styles.cameraName}>CAM-04</span>
                    <span className={styles.cameraLocation}>质检区域</span>
                  </div>
                  <div className={styles.videoControls}>
                    <button className={styles.videoBtn} title="全屏" onClick={(e) => {
                      const video = e.currentTarget.closest(`.${styles.videoWrapper}`)?.querySelector('video')
                      if (video) video.requestFullscreen?.()
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}

export default DigitalFactory
