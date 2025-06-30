import { Request, Response, NextFunction } from 'express'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { SignOptions } from 'jsonwebtoken'
import { logger } from '../utils/logger'
import { UserModel } from '../models/user.model'
import { UserService } from '../services/user.service'
import { AuditLogService } from '../services/auditLog.service'
import { UserOperation, UserStatus } from '../types/user.types'

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown'

      // 检查最近失败次数
      const recentFailedAttempts = await AuditLogService.getRecentFailedLogins(username);
      if (recentFailedAttempts >= 5) {
        return res.status(429).json({
          code: 2004,
          message: '登录失败次数过多，请30分钟后再试',
        })
      }

      // 查找用户
      const user = await UserModel.findByUsername(username)
      if (!user) {
        // 记录失败登录
        await AuditLogService.log({
          operatorId: 'anonymous',
          operation: UserOperation.LOGIN_FAILED,
          details: { username, reason: '用户不存在' },
          ipAddress: clientIp,
        })
        
        return res.status(401).json({
          code: 2001,
          message: '用户名或密码错误',
        })
      }

      // 检查账号状态
      if (user.status === UserStatus.LOCKED) {
        return res.status(403).json({
          code: 2005,
          message: '账号已被锁定，请联系管理员',
        })
      }

      if (user.status === UserStatus.INACTIVE) {
        return res.status(403).json({
          code: 2006,
          message: '账号已被禁用',
        })
      }

      // 检查账号有效期
      const now = new Date()
      if (user.validFrom > now) {
        return res.status(403).json({
          code: 2007,
          message: '账号尚未生效',
        })
      }

      if (user.validUntil && user.validUntil < now) {
        return res.status(403).json({
          code: 2008,
          message: '账号已过期',
        })
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        // 记录失败登录
        await AuditLogService.log({
          operatorId: user.id,
          operation: UserOperation.LOGIN_FAILED,
          details: { username, reason: '密码错误' },
          ipAddress: clientIp,
        })
        
        return res.status(401).json({
          code: 2001,
          message: '用户名或密码错误',
        })
      }

      // 检查是否需要修改密码
      if (user.mustChangePassword) {
        // 生成临时token，只能用于修改密码
        const tempToken = jwt.sign(
          { 
            userId: user.id, 
            username: user.username,
            mustChangePassword: true,
            type: 'temp'
          },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '1h' } as SignOptions
        )

        return res.json({
          code: 0,
          message: 'success',
          data: {
            mustChangePassword: true,
            tempToken,
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
            },
          },
        })
      }

      // 检查密码是否过期
      let passwordExpired = false
      if (user.passwordExpiresAt && user.passwordExpiresAt < now) {
        passwordExpired = true
      }

      // 生成tokens
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30m' } as SignOptions
      )

      const refreshToken = jwt.sign(
        { 
          userId: user.id, 
          type: 'refresh' 
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' } as SignOptions
      )

      // 更新最后登录时间
      await UserModel.updateLastLogin(user.id)

      // 记录成功登录
      await AuditLogService.log({
        operatorId: user.id,
        operation: UserOperation.LOGIN_SUCCESS,
        details: { username },
        ipAddress: clientIp,
      })

      // 返回响应
      res.json({
        code: 0,
        message: 'success',
        data: {
          accessToken,
          refreshToken,
          expiresIn: 1800, // 30 minutes in seconds
          tokenType: 'Bearer',
          passwordExpired,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            lastLoginAt: user.lastLoginAt,
          },
        },
      })

      logger.info(`User ${username} logged in successfully`)
    } catch (error) {
      next(error)
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      const { oldPassword, newPassword } = req.body

      await UserService.changePassword(userId, { oldPassword, newPassword })

      res.json({
        code: 0,
        message: 'success',
        data: {
          message: '密码修改成功，请重新登录',
        },
      })
    } catch (error: any) {
      if (error.message.includes('密码')) {
        return res.status(400).json({
          code: 3001,
          message: error.message,
        })
      }
      next(error)
    }
  }

  async changeInitialPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { tempToken, newPassword } = req.body

      // 验证临时token
      const decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'secret'
      ) as any

      if (decoded.type !== 'temp' || !decoded.mustChangePassword) {
        return res.status(401).json({
          code: 2002,
          message: 'Invalid token',
        })
      }

      // 验证新密码强度
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          code: 3001,
          message: '密码不符合要求：至少8位，包含大小写字母和数字',
        })
      }

      // 更新密码
      const newPasswordHash = await bcrypt.hash(newPassword, 10)
      await UserModel.updatePassword(decoded.userId, newPasswordHash)

      res.json({
        code: 0,
        message: 'success',
        data: {
          message: '密码修改成功，请使用新密码登录',
        },
      })
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          code: 2002,
          message: 'Invalid or expired token',
        })
      }
      next(error)
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation, you might want to:
      // 1. Invalidate the token in Redis
      // 2. Add the token to a blacklist
      // 3. Clear any server-side sessions

      res.json({
        code: 0,
        message: 'success',
        data: {
          message: '退出登录成功',
        },
      })
    } catch (error) {
      next(error)
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'secret'
      ) as any

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          code: 2002,
          message: 'Invalid refresh token',
        })
      }

      // 获取用户信息
      const user = await UserModel.findById(decoded.userId)
      if (!user || user.status !== UserStatus.ACTIVE) {
        return res.status(401).json({
          code: 2002,
          message: 'User not found or inactive',
        })
      }

      // Generate new tokens
      const accessToken = jwt.sign(
        { 
          userId: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30m' } as SignOptions
      )

      const newRefreshToken = jwt.sign(
        { userId: decoded.userId, type: 'refresh' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' } as SignOptions
      )

      res.json({
        code: 0,
        message: 'success',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 1800,
        },
      })
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          code: 2002,
          message: 'Invalid or expired refresh token',
        })
      }
      next(error)
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      const user = await UserModel.findById(userId)

      if (!user) {
        return res.status(404).json({
          code: 4001,
          message: '用户不存在',
        })
      }

      res.json({
        code: 0,
        message: 'success',
        data: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          employeeId: user.employeeId,
          department: user.department,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          passwordExpiresAt: user.passwordExpiresAt,
          validUntil: user.validUntil,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}