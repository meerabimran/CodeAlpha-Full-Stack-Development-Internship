import { Router } from 'express'
import { param } from 'express-validator'
import { listNotifications, markNotificationRead } from '../controllers/notificationController.js'
import authenticate from '../middleware/authMiddleware.js'
import { validateRequest } from '../utils/validators.js'

const router = Router()

router.use(authenticate)
router.get('/', listNotifications)
router.patch('/:id/read',
  param('id').isMongoId().withMessage('Notification ID is invalid.'),
  validateRequest,
  markNotificationRead,
)

export default router
