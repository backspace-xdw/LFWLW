import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { authenticate } from '../middleware/authenticate'
import { authorize } from '../middleware/authorize'
import { UserRole } from '../types/user.types'

const router = Router()
const userController = new UserController()

// All routes require authentication
router.use(authenticate)

// User management routes
router.get('/', userController.getUsers)
router.get('/:userId', userController.getUser)

// Admin only routes
router.post('/', authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), userController.createUser)
router.put('/:userId', authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), userController.updateUser)
router.post('/:userId/reset-password', authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), userController.resetPassword)
router.post('/:userId/lock', authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), userController.lockAccount)
router.post('/:userId/unlock', authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), userController.unlockAccount)

// Super admin only routes
router.delete('/:userId', authorize([UserRole.SUPER_ADMIN]), userController.deleteUser)

// Operation logs
router.get('/logs/operations', userController.getOperationLogs)

export default router