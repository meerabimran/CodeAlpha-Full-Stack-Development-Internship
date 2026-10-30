import { Router } from 'express'
import { body, param } from 'express-validator'
import { addComment, deleteComment, listComments } from '../controllers/commentController.js'
import authenticate from '../middleware/authMiddleware.js'
import { validateRequest } from '../utils/validators.js'

const router = Router()
const taskId = param('taskId').isMongoId().withMessage('Task ID is invalid.')

router.use(authenticate)

router.get('/:taskId/comments', taskId, validateRequest, listComments)
router.post('/:taskId/comments',
  taskId,
  body('content').isString().withMessage('Comment content is required.').trim().isLength({ min: 1, max: 3000 }).withMessage('Comment must be between 1 and 3000 characters.'),
  validateRequest,
  addComment,
)
router.delete('/:taskId/comments/:commentId',
  taskId,
  param('commentId').isMongoId().withMessage('Comment ID is invalid.'),
  validateRequest,
  deleteComment,
)

export default router
