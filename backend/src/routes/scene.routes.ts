import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'

const router = Router()
router.use(authenticate)

// 场景数据内存存储
interface Scene {
  id: string
  name: string
  type: '2d' | '3d'
  description?: string
  thumbnail?: string
  elements: any[]
  connections: any[]
  createdAt: string
  updatedAt: string
}

const scenes: Map<string, Scene> = new Map()

// 获取场景列表
router.get('/', (req, res) => {
  const list = Array.from(scenes.values()).map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    description: s.description,
    thumbnail: s.thumbnail,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }))
  res.json({ code: 0, message: 'success', data: list })
})

// 获取单个场景（含完整数据）
router.get('/:id', (req, res) => {
  const scene = scenes.get(req.params.id)
  if (!scene) return res.status(404).json({ code: 404, message: '场景不存在' })
  res.json({ code: 0, message: 'success', data: scene })
})

// 创建或更新场景
router.post('/', (req, res) => {
  const { name, type = '2d', description, elements = [], connections = [], thumbnail } = req.body
  if (!name) return res.status(400).json({ code: 400, message: '场景名称不能为空' })

  const id = `scene_${Date.now()}`
  const now = new Date().toISOString()
  const scene: Scene = { id, name, type, description, thumbnail, elements, connections, createdAt: now, updatedAt: now }
  scenes.set(id, scene)

  res.json({ code: 0, message: 'success', data: { id, name, type } })
})

// 更新场景
router.put('/:id', (req, res) => {
  const existing = scenes.get(req.params.id)
  if (!existing) return res.status(404).json({ code: 404, message: '场景不存在' })

  const { name, description, elements, connections, thumbnail } = req.body
  if (name !== undefined) existing.name = name
  if (description !== undefined) existing.description = description
  if (elements !== undefined) existing.elements = elements
  if (connections !== undefined) existing.connections = connections
  if (thumbnail !== undefined) existing.thumbnail = thumbnail
  existing.updatedAt = new Date().toISOString()

  res.json({ code: 0, message: 'success', data: { id: existing.id, updatedAt: existing.updatedAt } })
})

// 删除场景
router.delete('/:id', (req, res) => {
  if (!scenes.has(req.params.id)) return res.status(404).json({ code: 404, message: '场景不存在' })
  scenes.delete(req.params.id)
  res.json({ code: 0, message: 'success' })
})

export default router
