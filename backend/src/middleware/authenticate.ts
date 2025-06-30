import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        username: string
        role?: string
      }
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({
      code: 2001,
      message: '未提供认证信息',
    })
  }
  
  const [bearer, token] = authHeader.split(' ')
  
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({
      code: 2001,
      message: '认证信息格式错误',
    })
  }
  
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as any
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    }
    
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        code: 2002,
        message: '认证已过期',
      })
    }
    
    return res.status(401).json({
      code: 2001,
      message: '认证信息无效',
    })
  }
}