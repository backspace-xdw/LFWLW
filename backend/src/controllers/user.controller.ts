import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/user.service'
import { AuditLogService } from '../services/auditLog.service'
import { UserOperation } from '../types/user.types'

export class UserController {
  // 获取用户列表
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = (req as any).user
      const users = await UserService.getUsers(currentUser.role)

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: users,
          total: users.length,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  // 获取单个用户
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const user = await UserService.getUserById(userId)

      if (!user) {
        return res.status(404).json({
          code: 4001,
          message: '用户不存在',
        })
      }

      res.json({
        code: 0,
        message: 'success',
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  // 创建用户
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = (req as any).user
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
      
      const userData = {
        username: req.body.username,
        fullName: req.body.fullName,
        employeeId: req.body.employeeId,
        department: req.body.department,
        role: req.body.role,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : undefined,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
      }

      const result = await UserService.createUser(
        userData, 
        currentUser.userId, 
        currentUser.role
      )

      // 记录操作日志
      await AuditLogService.log({
        operatorId: currentUser.userId,
        operation: UserOperation.CREATE_USER,
        targetUserId: result.id,
        details: {
          username: result.username,
          role: result.role,
          initialPassword: result.initialPassword,
        },
        ipAddress: clientIp,
      })

      res.json({
        code: 0,
        message: 'success',
        data: {
          user: {
            id: result.id,
            username: result.username,
            fullName: result.fullName,
            role: result.role,
            status: result.status,
          },
          initialPassword: result.initialPassword,
        },
      })
    } catch (error: any) {
      if (error.message.includes('权限')) {
        return res.status(403).json({
          code: 2003,
          message: error.message,
        })
      }
      if (error.message.includes('已存在')) {
        return res.status(400).json({
          code: 4002,
          message: error.message,
        })
      }
      next(error)
    }
  }

  // 更新用户
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = (req as any).user
      const { userId } = req.params
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

      const updateData = {
        fullName: req.body.fullName,
        department: req.body.department,
        role: req.body.role,
        status: req.body.status,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
      }

      const updatedUser = await UserService.updateUser(
        userId,
        updateData,
        currentUser.userId,
        currentUser.role
      )

      if (!updatedUser) {
        return res.status(404).json({
          code: 4001,
          message: '用户不存在',
        })
      }

      // 记录操作日志
      await AuditLogService.log({
        operatorId: currentUser.userId,
        operation: UserOperation.UPDATE_USER,
        targetUserId: userId,
        details: updateData,
        ipAddress: clientIp,
      })

      res.json({
        code: 0,
        message: 'success',
        data: updatedUser,
      })
    } catch (error: any) {
      if (error.message.includes('权限')) {
        return res.status(403).json({
          code: 2003,
          message: error.message,
        })
      }
      next(error)
    }
  }

  // 重置密码
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = (req as any).user
      const { userId } = req.params
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

      const newPassword = await UserService.resetPassword(userId, currentUser.role)

      // 记录操作日志
      await AuditLogService.log({
        operatorId: currentUser.userId,
        operation: UserOperation.RESET_PASSWORD,
        targetUserId: userId,
        details: { reason: req.body.reason },
        ipAddress: clientIp,
      })

      res.json({
        code: 0,
        message: 'success',
        data: {
          tempPassword: newPassword,
          message: '密码已重置，请通知用户使用新密码登录',
        },
      })
    } catch (error: any) {
      if (error.message.includes('权限')) {
        return res.status(403).json({
          code: 2003,
          message: error.message,
        })
      }
      next(error)
    }
  }

  // 锁定账号
  async lockAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = (req as any).user
      const { userId } = req.params
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

      await UserService.lockAccount(userId, currentUser.role)

      // 记录操作日志
      await AuditLogService.log({
        operatorId: currentUser.userId,
        operation: UserOperation.LOCK_ACCOUNT,
        targetUserId: userId,
        details: { reason: req.body.reason },
        ipAddress: clientIp,
      })

      res.json({
        code: 0,
        message: 'success',
        data: {
          message: '账号已锁定',
        },
      })
    } catch (error: any) {
      if (error.message.includes('权限')) {
        return res.status(403).json({
          code: 2003,
          message: error.message,
        })
      }
      next(error)
    }
  }

  // 解锁账号
  async unlockAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = (req as any).user
      const { userId } = req.params
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

      await UserService.unlockAccount(userId, currentUser.role)

      // 记录操作日志
      await AuditLogService.log({
        operatorId: currentUser.userId,
        operation: UserOperation.UNLOCK_ACCOUNT,
        targetUserId: userId,
        details: { reason: req.body.reason },
        ipAddress: clientIp,
      })

      res.json({
        code: 0,
        message: 'success',
        data: {
          message: '账号已解锁',
        },
      })
    } catch (error: any) {
      if (error.message.includes('权限')) {
        return res.status(403).json({
          code: 2003,
          message: error.message,
        })
      }
      next(error)
    }
  }

  // 删除用户
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUser = (req as any).user
      const { userId } = req.params
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

      await UserService.deleteUser(userId, currentUser.role)

      // 记录操作日志
      await AuditLogService.log({
        operatorId: currentUser.userId,
        operation: UserOperation.DELETE_USER,
        targetUserId: userId,
        details: { reason: req.body.reason },
        ipAddress: clientIp,
      })

      res.json({
        code: 0,
        message: 'success',
        data: {
          message: '用户已删除',
        },
      })
    } catch (error: any) {
      if (error.message.includes('权限')) {
        return res.status(403).json({
          code: 2003,
          message: error.message,
        })
      }
      next(error)
    }
  }

  // 获取操作日志
  async getOperationLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        operatorId: req.query.operatorId as string,
        targetUserId: req.query.targetUserId as string,
        operation: req.query.operation as UserOperation,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      }

      const logs = await AuditLogService.getLogs(filters)

      res.json({
        code: 0,
        message: 'success',
        data: {
          items: logs,
          total: logs.length,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}