import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Device routes (placeholder)
router.get('/', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    },
  })
})

export default router