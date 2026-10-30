import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

const port = Number.parseInt(process.env.PORT || '5000', 10)
const jwtSecret = process.env.JWT_SECRET

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be a valid TCP port.')
  process.exit(1)
}

if (!jwtSecret || jwtSecret.length < 32) {
  console.error('JWT_SECRET must be configured with at least 32 characters.')
  process.exit(1)
}

const app = express()
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(null, false)
  },
}))
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: false, limit: '100kb' }))

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/tasks', commentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

await connectDB(process.env.MONGODB_URI)
const server = app.listen(port, () => {
  console.info(`TaskFlow API listening on port ${port}.`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      mongoose.disconnect().finally(() => process.exit(0))
    })
  })
}
