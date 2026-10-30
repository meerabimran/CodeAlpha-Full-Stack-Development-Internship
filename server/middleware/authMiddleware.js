import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication is required.' })
  }

  const token = authorization.slice(7).trim()
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid authentication credentials.' })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' })
  }

  if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' })
  }

  const user = await User.findById(payload.sub).select('name email avatar')
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid authentication credentials.' })
  }

  req.user = user
  next()
})

export default authenticate
