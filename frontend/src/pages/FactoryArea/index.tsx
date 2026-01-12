import React, { useEffect, useState, useRef } from 'react'
import { Card, Row, Col, Statistic, Progress } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  ApiOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import { Line } from '@ant-design/plots'
import ReactECharts from 'echarts-for-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {
  createDetailedBoxOpener,
  createDetailedMetalDetector,
  createDetailedXRayInspector,
  createDetailedCheckweigher,
  createDetailedSlicer,
  createDetailedPacker,
  createDetailedPalletizer,
  createDetailedLaminator,
  createRealisticRollerConveyor,
  createAlarmIndicator
} from '../DigitalFactory/EquipmentModels'
import { digitalFactoryService } from '@/services/digitalFactory'
import styles from './index.module.scss'
// import { PolygonBorder } from './PolygonBorder'

const FactoryArea: React.FC = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeNav, setActiveNav] = useState('overview') // 'overview' | 'equipment' | 'process'
  const [productATrend, setProductATrend] = useState<'日' | '周' | '月'>('日')
  const [productBTrend, setProductBTrend] = useState<'日' | '周' | '月'>('日')
  const [productCTrend, setProductCTrend] = useState<'日' | '周' | '月'>('日')
  const [productionOverviewPeriod, setProductionOverviewPeriod] = useState<'日' | '周' | '月'>('日')
  const mountRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)

  // 数据状态
  const [qualificationRateData, setQualificationRateData] = useState<any[]>([])
  const [productQualificationData, setProductQualificationData] = useState<any[]>([])
  const [warehouseInventoryData, setWarehouseInventoryData] = useState<any[]>([])
  const [productionLineExceptionData, setProductionLineExceptionData] = useState<any[]>([])
  const [productionOverviewData, setProductionOverviewData] = useState<any[]>([])
  const [productATrendData, setProductATrendData] = useState<any[]>([])
  const [productBTrendData, setProductBTrendData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Helper function to create text sprite
  const createTextSprite = (
    text: string,
    options: {
      fontSize?: number
      fontColor?: string
      backgroundColor?: string
      borderColor?: string
    } = {}
  ) => {
    const {
      fontSize = 32,
      fontColor = '#ffffff',
      backgroundColor = 'rgba(0, 0, 0, 0.7)',
      borderColor = '#ffffff'
    } = options

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 512
    canvas.height = 128

    // Draw background
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Draw border
    context.strokeStyle = borderColor
    context.lineWidth = 4
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

    // Draw text
    context.font = `bold ${fontSize}px Arial, sans-serif`
    context.fillStyle = fontColor
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(2, 0.5, 1)

    return sprite
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)

      // 并行加载所有数据
      const [
        qualificationRate,
        productQualification,
        warehouseInventory,
        productionLineException,
      ] = await Promise.all([
        digitalFactoryService.getQualificationRate().catch(() => []),
        digitalFactoryService.getProductQualification().catch(() => []),
        digitalFactoryService.getWarehouseInventory().catch(() => []),
        digitalFactoryService.getProductionLineException().catch(() => []),
      ])

      setQualificationRateData(qualificationRate)
      setProductQualificationData(productQualification)
      setWarehouseInventoryData(warehouseInventory)
      setProductionLineExceptionData(productionLineException)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载产量完成概览数据
  const loadProductionOverview = async (period: '日' | '周' | '月') => {
    try {
      const data = await digitalFactoryService.getProductionOverview(period).catch(() => [])
      setProductionOverviewData(data)
    } catch (error) {
      console.error('加载产量完成概览数据失败:', error)
    }
  }

  // 加载产品A趋势数据
  const loadProductATrend = async (period: '日' | '周' | '月') => {
    try {
      const data = await digitalFactoryService.getProductATrend(period).catch(() => [])
      setProductATrendData(data)
    } catch (error) {
      console.error('加载产品A趋势数据失败:', error)
    }
  }

  // 加载产品B趋势数据
  const loadProductBTrend = async (period: '日' | '周' | '月') => {
    try {
      const data = await digitalFactoryService.getProductBTrend(period).catch(() => [])
      setProductBTrendData(data)
    } catch (error) {
      console.error('加载产品B趋势数据失败:', error)
    }
  }

  // 初始加载数据
  useEffect(() => {
    loadData()
  }, [])

  // 产量完成概览周期变化时重新加载
  useEffect(() => {
    loadProductionOverview(productionOverviewPeriod)
  }, [productionOverviewPeriod])

  // 产品A趋势周期变化时重新加载
  useEffect(() => {
    loadProductATrend(productATrend)
  }, [productATrend])

  // 产品B趋势周期变化时重新加载
  useEffect(() => {
    loadProductBTrend(productBTrend)
  }, [productBTrend])

  // 表格悬停暂停效果已通过CSS实现 (:hover { animation-play-state: paused; })

  // Initialize 3D scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1628)
    scene.fog = new THREE.Fog(0x0a1628, 50, 200)

    // Camera setup - 鸟瞰视角,类似图片中的俯视效果
    const camera = new THREE.PerspectiveCamera(
      45,  // 更小的FOV产生更少的透视变形
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 60, 45)  // 更高的俯视角度，从上往下看
    camera.lookAt(0, 0, 0)  // 看向场景中心

    // Renderer setup - 禁用阴影提高性能
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = false  // 禁用阴影以提高性能
    mountRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = false  // 禁用自动旋转

    // 启用平移功能 - 可以拖拽移动场景中心
    controls.enablePan = true
    controls.panSpeed = 1.0
    controls.screenSpacePanning = false  // 使用世界空间平移，保持在水平面上

    // 鼠标按键设置：左键平移（拖拽），右键旋转，滚轮缩放
    // 这样可以用左键拖拽某个位置到中心，然后滚轮放大缩小
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,      // 左键拖拽平移
      MIDDLE: THREE.MOUSE.DOLLY,  // 中键缩放
      RIGHT: THREE.MOUSE.ROTATE   // 右键旋转
    }

    // 缩放设置
    controls.enableZoom = true
    controls.zoomSpeed = 1.0
    controls.minDistance = 5   // 最小缩放距离
    controls.maxDistance = 100 // 最大缩放距离

    // Enhanced Lighting - 工业环境照明
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    // 主光源 - 模拟顶部工业照明
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
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
    const fillLight = new THREE.DirectionalLight(0x3498db, 0.4)
    fillLight.position.set(-30, 20, -20)
    scene.add(fillLight)

    // 点光源增强设备照明
    const spotlights = [
      { pos: [-30, 15, -15], color: 0xffffff },
      { pos: [0, 15, 0], color: 0xffffff },
      { pos: [25, 15, 0], color: 0xffffff }
    ]

    spotlights.forEach(({ pos, color }) => {
      const light = new THREE.PointLight(color, 0.6, 30)
      light.position.set(...pos)
      light.castShadow = true
      scene.add(light)
    })

    // 创建地板
    const floorGeometry = new THREE.PlaneGeometry(240, 160)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f1f3a,        // 深蓝色地板
      metalness: 0.15,        // 环氧地坪金属光泽
      roughness: 0.28,        // 光滑抛光表面
      side: THREE.DoubleSide,
      envMapIntensity: 0.5    // 环境光反射
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.add(floor)

    // 创建围墙
    const wallHeight = 5
    const wallThickness = 0.3
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5deb3,  // 浅黄色
      metalness: 0.1,
      roughness: 0.8
    })

    // 前墙
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(240, wallHeight, wallThickness),
      wallMaterial
    )
    frontWall.position.set(0, wallHeight / 2, -80)
    frontWall.castShadow = true
    frontWall.receiveShadow = true
    scene.add(frontWall)

    // 后墙
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(240, wallHeight, wallThickness),
      wallMaterial
    )
    backWall.position.set(0, wallHeight / 2, 80)
    backWall.castShadow = true
    backWall.receiveShadow = true
    scene.add(backWall)

    // 左墙
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 160),
      wallMaterial
    )
    leftWall.position.set(-120, wallHeight / 2, 0)
    leftWall.castShadow = true
    leftWall.receiveShadow = true
    scene.add(leftWall)

    // 右墙
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 160),
      wallMaterial
    )
    rightWall.position.set(120, wallHeight / 2, 0)
    rightWall.castShadow = true
    rightWall.receiveShadow = true
    scene.add(rightWall)

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
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // 设备运行数据
  const deviceStats = {
    total: 99,
    running: 95,
    maintenance: 3,
    fault: 1,
    utilization: 96.2,
  }

  // 产品合格率数据
  const processData = {
    name: '主流程',
    type: 'MA3002',
    count: 34000,
    efficiency: '92.3%',
    duration: '2023.3.1',
    status: '1232单',
  }

  // 仓库存料数据
  const personnelData = {
    attendance: '100%',
    onDuty: 123,
    workers: 98,
    engineers: 25,
    management: 8,
  }

  // 产线异常信息数据
  const energyTrendData = [
    { date: '08/01', 生产能耗: 35, 计划能耗: 45, 社会能耗: 25 },
    { date: '08/02', 生产能耗: 42, 计划能耗: 48, 社会能耗: 28 },
    { date: '08/03', 生产能耗: 38, 计划能耗: 46, 社会能耗: 26 },
    { date: '08/04', 生产能耗: 45, 计划能耗: 50, 社会能耗: 30 },
    { date: '08/05', 生产能耗: 40, 计划能耗: 47, 社会能耗: 27 },
    { date: '08/06', 生产能耗: 48, 计划能耗: 52, 社会能耗: 32 },
    { date: '08/07', 生产能耗: 43, 计划能耗: 49, 社会能耗: 29 },
    { date: '08/08', 生产能耗: 46, 计划能耗: 51, 社会能耗: 31 },
  ]

  // 7天能耗趋势数据
  const weeklyEnergyData = [
    { date: '03/10', value: 45 },
    { date: '03/11', value: 52 },
    { date: '03/12', value: 48 },
    { date: '03/13', value: 55 },
    { date: '03/14', value: 50 },
    { date: '03/15', value: 58 },
    { date: '03/16', value: 53 },
  ]

  // 产量完成概览数据 - 使用API数据或默认值
  const productionOverview = productionOverviewData.length > 0 ? productionOverviewData : [
    { name: '产品A', plan: 1007, actual: 907, completion: 20 },
    { name: '产品B', plan: 1007, actual: 907, completion: 40 },
  ]

  // 区域传感器概览
  const sensorStatus = [
    { name: '测油温度', status: 'normal', value: 0.3 },
    { name: '温度', status: 'warning', value: 0.2 },
    { name: '电流', status: 'normal', value: 0.1 },
    { name: '电压', status: 'normal', value: 0.15 },
    { name: '功率消耗', status: 'normal', value: 0.25 },
  ]

  // 实时监测趋势
  const realtimeData = Array.from({ length: 20 }, (_, i) => ({
    time: `0:00:${i.toString().padStart(2, '0')}`,
    测油温度: Math.sin(i * 0.5) * 0.1 + 0.15,
    温度: Math.cos(i * 0.5) * 0.1 + 0.1,
    电流: Math.sin(i * 0.3 + 1) * 0.08 + 0.12,
    电压: Math.cos(i * 0.4 + 2) * 0.09 + 0.11,
  }))

  // 7天能耗趋势（右侧）
  const weeklyPowerData = Array.from({ length: 7 }, (_, i) => {
    const baseValues = [120, 150, 180, 160, 190, 170, 200]
    return {
      date: `04-${(11 + i).toString().padStart(2, '0')}`,
      value: baseValues[i % baseValues.length] + Math.random() * 50,
    }
  })

  const energyLineConfig = {
    data: energyTrendData.flatMap(item => [
      { date: item.date, type: '生产能耗', value: item.生产能耗 },
      { date: item.date, type: '计划能耗', value: item.计划能耗 },
      { date: item.date, type: '社会能耗', value: item.社会能耗 },
    ]),
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#1890ff', '#52c41a', '#faad14'],
  }

  const weeklyEnergyConfig = {
    data: weeklyEnergyData,
    xField: 'date',
    yField: 'value',
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#1890ff 1:#141414',
    },
    line: {
      color: '#1890ff',
    },
  }

  const realtimeConfig = {
    data: realtimeData.flatMap(item => [
      { time: item.time, type: '测油温度', value: item.测油温度 },
      { time: item.time, type: '温度', value: item.温度 },
      { time: item.time, type: '电流', value: item.电流 },
      { time: item.time, type: '电压', value: item.电压 },
    ]),
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 1000,
      },
    },
    color: ['#52c41a', '#faad14', '#1890ff', '#722ed1'],
  }

  const weeklyPowerConfig = {
    data: weeklyPowerData,
    xField: 'date',
    yField: 'value',
    columnStyle: {
      fill: 'l(270) 0:#1890ff 0.5:#36cfc9 1:#52c41a',
    },
  }

  return (
    <div className={styles.digitalFactory}>
      {/* 顶部标题栏 - BigDataView风格（简洁版）*/}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          {/* 左侧返回按钮 */}
          <div className={styles.backButton} onClick={() => navigate('/digital-factory')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 17 16" style={{ flexShrink: 0 }}>
              <path fill="currentColor" fillRule="evenodd" d="m1.307 5.988l5.309-4.645c.411-.41.891-.479 1.302-.068v3.132l.229-.001c5.016 0 8.738 3.563 8.738 8.41c0 1.688-.774 1.073-1.097.484c-1.522-2.78-4.197-4.677-7.681-4.677l-.19.001v3.065c-.411.41-.941.361-1.302.068L1.306 7.474a1.052 1.052 0 0 1 .001-1.486"></path>
            </svg>
            <span>返回</span>
          </div>

          {/* 中央标题 */}
          <div className={styles.titleContainer}>
            <div className={styles.titleWrapper}>
              <h1 className={styles.mainTitle}>TTF厂区总览监控系统</h1>
            </div>
          </div>

          {/* 右侧日期时间 */}
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
        </div>
      </div>

      {/* 主要内容区 */}
      <div className={styles.mainContent}>
        {/* 3D场景作为全局背景 */}
        <div className={styles.scene3dBackground} ref={mountRef}></div>

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
            bordered={false}>
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
            bordered={false}
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
            bordered={false}
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
            bordered={false}
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
        </div>

        {/* 中间面板 - 原3D场景已移至背景层 */}
        <div className={styles.centerPanel}>
          {/* 八边形边框 - 使用SVG绘制，模仿PNG样式 */}
          <svg className={styles.octagonBorderSvg} viewBox="0 0 1000 1000" preserveAspectRatio="none">
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
            bordered={false}
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

          {/* 产品A产量趋势 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%' }}>产品A产量趋势</div>
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
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
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
            bordered={false}
          >
            <div className={styles.trendButtons}>
              <button
                className={productATrend === '日' ? styles.active : ''}
                onClick={() => setProductATrend('日')}
              >
                日
              </button>
              <button
                className={productATrend === '周' ? styles.active : ''}
                onClick={() => setProductATrend('周')}
              >
                周
              </button>
              <button
                className={productATrend === '月' ? styles.active : ''}
                onClick={() => setProductATrend('月')}
              >
                月
              </button>
            </div>
            <ReactECharts
              option={{
                grid: {
                  left: '10%',
                  right: '6%',
                  top: '10%',
                  bottom: '15%',
                },
                xAxis: {
                  type: 'category',
                  data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
                    name: '产量',
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
                            x2: 0,
                            y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(0, 226, 207, 0.6)' },
                              { offset: 0.5, color: 'rgba(0, 226, 207, 0.4)' },
                              { offset: 1, color: 'rgba(12, 31, 85, 0.3)' },
                            ],
                          },
                        },
                      },
                      850,
                    ],
                    barWidth: 10,
                    itemStyle: {
                      color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                          { offset: 0, color: '#00e2cf' },
                          { offset: 1, color: '#0c1f55' },
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
                      { value: 850, symbolSize: [10, 10] },
                    ],
                    symbolPosition: 'end',
                    symbol: 'diamond',
                    symbolOffset: [0, '-50%'],
                    itemStyle: {
                      color: '#6dfff3',
                    },
                    z: 3,
                  },
                ],
              }}
              style={{ height: '180px' }}
            />
          </Card>

          {/* 产品B产量趋势 */}
          <Card
            style={{ marginTop: '4px' }}
            className={`${styles.card} ${styles.noBorder}`}
            title={
              <div style={{ paddingBottom: '5px', paddingTop: '10px', width: '100%' }}>
                <div style={{ paddingLeft: '5%' }}>产品B产量趋势</div>
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
                      <stop offset="0%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
                      <stop offset="5%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: 'rgba(0, 200, 255, 0.8)', stopOpacity: 1 }} />
                      <stop offset="95%" style={{ stopColor: 'rgba(0, 180, 255, 0.4)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0, 180, 255, 0)', stopOpacity: 0 }} />
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
            bordered={false}
          >
            <div className={styles.trendButtons}>
              <button
                className={productBTrend === '日' ? styles.active : ''}
                onClick={() => setProductBTrend('日')}
              >
                日
              </button>
              <button
                className={productBTrend === '周' ? styles.active : ''}
                onClick={() => setProductBTrend('周')}
              >
                周
              </button>
              <button
                className={productBTrend === '月' ? styles.active : ''}
                onClick={() => setProductBTrend('月')}
              >
                月
              </button>
            </div>
            <ReactECharts
              option={{
                grid: {
                  left: '10%',
                  right: '6%',
                  top: '10%',
                  bottom: '15%',
                },
                xAxis: {
                  type: 'category',
                  data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
                    name: '产量',
                    type: 'line',
                    data: [720, 650, 580, 760, 820, 550, 700],
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
                  },
                ],
              }}
              style={{ height: '180px' }}
            />
          </Card>

        </div>
      </div>
    </div>
  )
}

export default FactoryArea
