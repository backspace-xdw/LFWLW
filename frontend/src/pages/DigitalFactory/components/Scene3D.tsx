/**
 * 3D场景组件
 * 封装 Three.js 场景的初始化和渲染逻辑
 */
import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// @ts-ignore - Three.js类型定义可能不完整
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { ViewPresetKey, ModelLoadProgress } from '../types'
import { loadModels, calculateTotalProgress } from '../utils/modelLoader'
import {
  cameraConfig,
  rendererConfig,
  controlsConfig,
  viewPresets,
  viewAnimationConfig,
  lightingConfig,
  floorConfig,
  displayAreaConfig,
  modelConfigs,
  TOTAL_MODELS,
  PRIMARY_MODELS,
} from '../config/scene3dConfig'
import styles from '../index.module.scss'

export interface Scene3DRef {
  switchToPresetView: (presetKey: ViewPresetKey) => void
}

interface Scene3DProps {
  onLoadProgress?: (progress: number, text: string) => void
  onLoadComplete?: () => void
}

export const Scene3D = forwardRef<Scene3DRef, Scene3DProps>(
  ({ onLoadProgress, onLoadComplete }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const controlsRef = useRef<OrbitControls | null>(null)
    const modelLoadProgressRef = useRef<ModelLoadProgress>({})
    const primaryLoadedCountRef = useRef(0)
    const sceneRevealedRef = useRef(false)

    // 更新总体加载进度
    const updateTotalProgress = useCallback(
      (text: string, isPrimaryComplete?: boolean) => {
        const progress = calculateTotalProgress(
          modelLoadProgressRef.current,
          TOTAL_MODELS
        )
        onLoadProgress?.(progress, text)

        // 主要模型加载完成后立即显示场景（不等全部完成）
        if (isPrimaryComplete && !sceneRevealedRef.current) {
          primaryLoadedCountRef.current += 1
          if (primaryLoadedCountRef.current >= PRIMARY_MODELS) {
            sceneRevealedRef.current = true
            setTimeout(() => {
              onLoadComplete?.()
            }, 300)
          }
        }

        // 全部完成兜底
        if (progress >= 100 && !sceneRevealedRef.current) {
          sceneRevealedRef.current = true
          setTimeout(() => {
            onLoadComplete?.()
          }, 300)
        }
      },
      [onLoadProgress, onLoadComplete]
    )

    // 切换预设视角（带平滑动画）
    const switchToPresetView = useCallback((presetKey: ViewPresetKey) => {
      const preset = viewPresets[presetKey]
      if (!preset || !cameraRef.current || !controlsRef.current) return

      const camera = cameraRef.current
      const controls = controlsRef.current

      // 当前位置
      const startPosition = camera.position.clone()
      const startTarget = controls.target.clone()

      // 目标位置
      const endPosition = preset.position.clone()
      const endTarget = preset.target.clone()

      // 动画参数
      const duration = viewAnimationConfig.duration
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 缓动函数 (easeInOutCubic)
        const eased =
          progress < 0.5
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
    }, [])

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      switchToPresetView,
    }))

    useEffect(() => {
      if (!mountRef.current) return

      // Scene setup
      const scene = new THREE.Scene()
      const sceneBgColor = new THREE.Color(rendererConfig.backgroundColor)
      scene.background = sceneBgColor

      // Camera setup
      const camera = (cameraRef.current = new THREE.PerspectiveCamera(
        cameraConfig.fov,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        cameraConfig.near,
        cameraConfig.far
      ))
      camera.position.set(
        cameraConfig.initialPosition.x,
        cameraConfig.initialPosition.y,
        cameraConfig.initialPosition.z
      )
      camera.lookAt(
        cameraConfig.lookAt.x,
        cameraConfig.lookAt.y,
        cameraConfig.lookAt.z
      )

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({
        antialias: rendererConfig.antialias,
        alpha: rendererConfig.alpha,
      })
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, rendererConfig.maxPixelRatio)
      )
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      renderer.setClearColor(sceneBgColor, 1)
      renderer.shadowMap.enabled = false
      mountRef.current.appendChild(renderer.domElement)

      // Controls setup
      const controls = (controlsRef.current = new OrbitControls(
        camera,
        renderer.domElement
      ) as any)
      controls.enableDamping = controlsConfig.enableDamping
      controls.dampingFactor = controlsConfig.dampingFactor
      controls.autoRotate = controlsConfig.autoRotate
      controls.minPolarAngle = controlsConfig.minPolarAngle
      controls.maxPolarAngle = controlsConfig.maxPolarAngle
      controls.minAzimuthAngle = controlsConfig.minAzimuthAngle
      controls.maxAzimuthAngle = controlsConfig.maxAzimuthAngle
      controls.enablePan = controlsConfig.enablePan
      controls.panSpeed = controlsConfig.panSpeed
      controls.screenSpacePanning = controlsConfig.screenSpacePanning
      controls.mouseButtons = controlsConfig.mouseButtons
      controls.rotateSpeed = controlsConfig.rotateSpeed
      controls.enableZoom = controlsConfig.enableZoom
      controls.zoomSpeed = controlsConfig.zoomSpeed
      controls.minDistance = controlsConfig.minDistance
      controls.maxDistance = controlsConfig.maxDistance

      // 限制平移范围
      const clampPan = () => {
        const { x: limitX, z: limitZ, y: limitY } = controlsConfig.panLimits
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

      // Lighting setup
      const hemiLight = new THREE.HemisphereLight(
        lightingConfig.hemisphere.skyColor,
        lightingConfig.hemisphere.groundColor,
        lightingConfig.hemisphere.intensity
      )
      scene.add(hemiLight)

      const ambientLight = new THREE.AmbientLight(
        lightingConfig.ambient.color,
        lightingConfig.ambient.intensity
      )
      scene.add(ambientLight)

      const mainLight = new THREE.DirectionalLight(
        lightingConfig.mainDirectional.color,
        lightingConfig.mainDirectional.intensity
      )
      mainLight.position.set(
        lightingConfig.mainDirectional.position.x,
        lightingConfig.mainDirectional.position.y,
        lightingConfig.mainDirectional.position.z
      )
      mainLight.castShadow = true
      mainLight.shadow.mapSize.width = lightingConfig.mainDirectional.shadow.mapSize
      mainLight.shadow.mapSize.height = lightingConfig.mainDirectional.shadow.mapSize
      const shadowSize = lightingConfig.mainDirectional.shadow.cameraSize
      mainLight.shadow.camera.left = -shadowSize
      mainLight.shadow.camera.right = shadowSize
      mainLight.shadow.camera.top = shadowSize
      mainLight.shadow.camera.bottom = -shadowSize
      scene.add(mainLight)

      const fillLight = new THREE.DirectionalLight(
        lightingConfig.fillDirectional.color,
        lightingConfig.fillDirectional.intensity
      )
      fillLight.position.set(
        lightingConfig.fillDirectional.position.x,
        lightingConfig.fillDirectional.position.y,
        lightingConfig.fillDirectional.position.z
      )
      scene.add(fillLight)

      lightingConfig.spotlights.forEach(({ position, color, intensity, distance }) => {
        const light = new THREE.PointLight(color, intensity, distance)
        light.position.set(position[0], position[1], position[2])
        light.castShadow = false
        scene.add(light)
      })

      // Floor setup
      const floorGeometry = new THREE.PlaneGeometry(
        floorConfig.width,
        floorConfig.height
      )
      const floorMaterial = new THREE.MeshBasicMaterial({
        color: floorConfig.color,
        side: THREE.DoubleSide,
      })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.y = floorConfig.positionY
      floor.receiveShadow = false
      scene.add(floor)

      // Display area setup
      const displayAreaGeometry = new THREE.PlaneGeometry(
        displayAreaConfig.width,
        displayAreaConfig.height
      )
      const displayAreaMaterial = new THREE.MeshStandardMaterial({
        color: displayAreaConfig.material.color,
        emissive: displayAreaConfig.material.emissive,
        emissiveIntensity: displayAreaConfig.material.emissiveIntensity,
        roughness: displayAreaConfig.material.roughness,
        metalness: displayAreaConfig.material.metalness,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: displayAreaConfig.material.opacity,
      })
      const displayArea = new THREE.Mesh(displayAreaGeometry, displayAreaMaterial)
      displayArea.rotation.x = -Math.PI / 2
      displayArea.position.set(
        displayAreaConfig.position.x,
        displayAreaConfig.position.y,
        displayAreaConfig.position.z
      )
      scene.add(displayArea)

      // Model loader setup
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/')

      const gltfLoader = new GLTFLoader()
      // @ts-ignore - Three.js类型定义不完整
      gltfLoader.setDRACOLoader(dracoLoader)

      // Load models
      loadModels(modelConfigs, {
        gltfLoader,
        scene,
        onProgress: (modelKey, percent) => {
          modelLoadProgressRef.current[modelKey] = percent
          updateTotalProgress('正在加载3D场景...')
        },
        onModelLoaded: (modelKey, label) => {
          const config = modelConfigs.find(m => m.modelKey === modelKey)
          updateTotalProgress(`${label}加载完成`, config?.primary)
        },
        onError: (_modelKey, error) => {
          console.warn(`模型加载失败:`, error)
        },
      })

      // Animation loop
      let animationId: number
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        controls.update()

        // 告警灯闪烁动画
        const time = Date.now() * 0.003
        scene.traverse((obj) => {
          if ((obj as any).isAlarmActive) {
            const intensity = Math.sin(time * 3) * 0.5 + 0.5
            if ((obj as any).alarmLight) {
              ;(obj as any).alarmLight.material.emissiveIntensity = 2 + intensity * 2
            }
            if ((obj as any).alarmPointLight) {
              ;(obj as any).alarmPointLight.intensity = 1 + intensity * 1.5
            }
          }
        })

        // 执行所有注册的动画函数
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

        if (width > 0 && height > 0) {
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height)
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
    }, [updateTotalProgress])

    return <div className={styles.scene3dBackground} ref={mountRef}></div>
  }
)

Scene3D.displayName = 'Scene3D'

export default Scene3D
