import { Router } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { getCurrentUser, login, register } from '../controllers/authController.js'
import authenticate from '../middleware/authMiddleware.js'
import { validateRequest } from '../utils/validators.js'

const router = Router()
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Try again later.' },
})

router.post('/register',
  authRateLimit,
  body('name').isString().withMessage('Name is required.').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('email').isEmail().withMessage('Enter a valid email address.').trim().toLowerCase(),
  body('password').isString().withMessage('Password is required.').isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters.'),
  validateRequest,
  register,
)

router.post('/login',
  authRateLimit,
  body('email').isEmail().withMessage('Enter a valid email address.').trim().toLowerCase(),
  body('password').isString().withMessage('Password is required.').isLength({ min: 1, max: 128 }).withMessage('Password is required.'),
  validateRequest,
  login,
)

router.get('/me', authenticate, getCurrentUser)

export default router
