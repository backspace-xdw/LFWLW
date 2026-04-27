/**
 * 3D模型加载器
 * 抽象模型加载逻辑，减少重复代码
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { ModelConfig, ModelLoadProgress } from '../types'

export interface LoadModelsOptions {
  gltfLoader: GLTFLoader
  scene: THREE.Scene
  onProgress: (modelKey: string, percent: number) => void
  onModelLoaded: (modelKey: string, label: string) => void
  onError: (modelKey: string, error: Error) => void
}

/**
 * 配置模型材质
 */
const configureMaterial = (child: THREE.Mesh) => {
  child.castShadow = false
  child.receiveShadow = false
  if (child.material) {
    if (Array.isArray(child.material)) {
      child.material.forEach((mat) => {
        mat.side = THREE.DoubleSide
      })
    } else {
      child.material.side = THREE.DoubleSide
    }
  }
}

/**
 * 加载单个模型
 */
export const loadModel = (
  config: ModelConfig,
  options: LoadModelsOptions
): Promise<THREE.Group> => {
  const { gltfLoader, scene, onProgress, onModelLoaded, onError } = options

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      config.path,
      (gltf) => {
        const model = gltf.scene

        // 设置缩放
        model.scale.set(...config.scale)

        // 设置位置
        model.position.set(...config.position)

        // 设置旋转（如果有）
        if (config.rotation) {
          model.rotation.set(...config.rotation)
        }

        // 配置材质
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            configureMaterial(child)
          }
        })

        scene.add(model)
        onModelLoaded(config.modelKey, config.label)
        onProgress(config.modelKey, 100)
        resolve(model as unknown as THREE.Group)
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100
          onProgress(config.modelKey, percent)
        }
      },
      (error) => {
        console.warn(`模型加载失败 [${config.label}]:`, error)
        onProgress(config.modelKey, 100) // 失败也标记完成
        const err = error instanceof Error ? error : new Error(String(error))
        onError(config.modelKey, err)
        reject(error)
      }
    )
  })
}

/**
 * 批量加载模型
 */
export const loadModels = async (
  configs: ModelConfig[],
  options: LoadModelsOptions
): Promise<void> => {
  const promises = configs.map((config) =>
    loadModel(config, options).catch(() => null) // 忽略单个模型加载失败
  )
  await Promise.all(promises)
}

/**
 * 计算总体加载进度
 */
export const calculateTotalProgress = (
  progressMap: ModelLoadProgress,
  totalModels: number
): number => {
  const progresses = Object.values(progressMap)
  if (progresses.length === 0) return 0
  const total = progresses.reduce((a, b) => a + b, 0)
  return Math.min(total / totalModels, 100)
}
