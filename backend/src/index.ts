import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import routes from './routes'
import { initializeDatabase } from './config/database'
import { initializeRedis } from './config/redis'
import { initializeMQTT } from './config/mqtt'
import { initializeSocketIO } from './config/socketio'
import { UserModel } from './models/user.model'

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API routes
app.use('/api/v1', routes)

// Socket.IO
initializeSocketIO(io)

// Error handling
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    // Initialize services
    await initializeDatabase()
    await initializeRedis()
    await initializeMQTT()
    
    // Initialize user model with default users
    await UserModel.initialize()
    logger.info('User model initialized with default users')
    
    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  httpServer.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
})