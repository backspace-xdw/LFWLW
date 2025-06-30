import { Request, Response, NextFunction } from 'express'
import { UserRole } from '../types/user.types'

export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user

    if (!user || !user.role) {
      return res.status(403).json({
        code: 2003,
        message: '权限不足',
      })
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        code: 2003,
        message: '权限不足：您没有执行此操作的权限',
      })
    }

    next()
  }
}