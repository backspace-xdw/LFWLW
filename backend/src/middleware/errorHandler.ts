import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  const code = err.code || 'INTERNAL_ERROR'

  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      details: err.details,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      headers: req.headers,
      body: req.body,
    },
  })

  res.status(statusCode).json({
    code: statusCode === 500 ? 1000 : statusCode,
    message,
    details: process.env.NODE_ENV === 'development' ? err.details : undefined,
    timestamp: Date.now(),
    requestId: req.headers['x-request-id'] || 'unknown',
  })
}