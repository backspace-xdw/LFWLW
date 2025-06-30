import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Data routes (placeholder)
router.get('/realtime/:deviceId', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      deviceId: req.params.deviceId,
      timestamp: Date.now(),
      data: [],
    },
  })
})

export default router