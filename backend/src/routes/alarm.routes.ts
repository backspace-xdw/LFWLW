import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Alarm routes (placeholder)
router.get('/active', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      items: [],
      total: 0,
      statistics: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    },
  })
})

export default router