import { Router } from 'express'
import authRoutes from './auth.routes'
import deviceRoutes from './device.routes'
import dataRoutes from './data.routes'
import alarmRoutes from './alarm.routes'
import userRoutes from './user.routes'
import alarmRulesRoutes from './alarmRules'
import analysisRoutes from './analysis.routes'
import sceneRoutes from './scene.routes'
import digitalFactoryRoutes from './digital-factory.routes'
import instrumentRoutes from './instrument.routes'
import alarmHandlingRoutes from './alarmHandling.routes'
import riskWarningRoutes from './riskWarning.routes'
import predictiveMaintenanceRoutes from './predictiveMaintenance.routes'

const router = Router()

// Public routes
router.use('/auth', authRoutes)

// Protected routes
router.use('/devices', deviceRoutes)
router.use('/data', dataRoutes)
router.use('/alarms', alarmRoutes)
router.use('/users', userRoutes)
router.use('/alarm-rules', alarmRulesRoutes)
router.use('/analysis', analysisRoutes)
router.use('/scenes', sceneRoutes)
router.use('/digital-factory', digitalFactoryRoutes)
router.use('/instruments', instrumentRoutes)
router.use('/alarm-handling', alarmHandlingRoutes)
router.use('/risk-warning', riskWarningRoutes)
router.use('/predictive-maintenance', predictiveMaintenanceRoutes)

// Default route
router.get('/', (req, res) => {
  res.json({
    message: 'LFWLW IoT Platform API v1',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

export default router