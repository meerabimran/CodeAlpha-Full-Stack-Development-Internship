import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, avatar: user.avatar || null }
}

function createToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, { subject: String(userId), expiresIn: '7d', algorithm: 'HS256' })
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  const normalizedEmail = email.trim().toLowerCase()

  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: 'Password must be no more than 72 bytes.' })
  }

  const existingUser = await User.exists({ email: normalizedEmail })
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  let user
  try {
    user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
    }
    throw error
  }

  return res.status(201).json({
    success: true,
    data: { user: publicUser(user), token: createToken(user.id) },
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' })
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false

  if (!passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' })
  }

  return res.status(200).json({
    success: true,
    data: { user: publicUser(user), token: createToken(user.id) },
  })
})

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: publicUser(req.user) } })
})
