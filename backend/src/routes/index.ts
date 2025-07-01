import { Router } from 'express'
import authRoutes from './auth.routes'
import deviceRoutes from './device.routes'
import dataRoutes from './data.routes'
import alarmRoutes from './alarm.routes'
import userRoutes from './user.routes'
import alarmRulesRoutes from './alarmRules'
import analysisRoutes from './analysis.routes'

const router = Router()

// Public routes
router.use('/auth', authRoutes)

// Protected routes (add auth middleware later)
router.use('/devices', deviceRoutes)
router.use('/data', dataRoutes)
router.use('/alarms', alarmRoutes)
router.use('/users', userRoutes)
router.use('/alarm-rules', alarmRulesRoutes)
router.use('/analysis', analysisRoutes)

// Default route
router.get('/', (req, res) => {
  res.json({
    message: 'LFWLW IoT Platform API v1',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

export default router