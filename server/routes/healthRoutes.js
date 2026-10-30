import { Router } from 'express'
import mongoose from 'mongoose'

const router = Router()

router.get('/', (req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  const healthy = database === 'connected'
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: { status: healthy ? 'ok' : 'degraded', database },
  })
})

export default router
