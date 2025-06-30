import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { validateRequest } from '../middleware/validateRequest'
import { loginSchema, refreshTokenSchema } from '../validators/auth.validator'
import { authenticate } from '../middleware/authenticate'

const router = Router()
const authController = new AuthController()

// Public routes
router.post('/login', validateRequest(loginSchema), authController.login)
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken)
router.post('/change-initial-password', authController.changeInitialPassword)

// Protected routes
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.getCurrentUser)
router.post('/change-password', authenticate, authController.changePassword)

export default router