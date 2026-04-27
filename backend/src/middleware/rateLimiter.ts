import { Request, Response, NextFunction } from 'express'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000, // convert to seconds
})

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await rateLimiter.consume(req.ip || 'anonymous')
    next()
  } catch (rejRes: any) {
    res.status(429).json({
      code: 429,
      message: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60,
    })
  }
}

export { rateLimiterMiddleware as rateLimiter }