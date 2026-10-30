import { Router } from 'express'
import { body, param } from 'express-validator'
import { createProject, deleteProject, getProject, listProjects, updateProject } from '../controllers/projectController.js'
import authenticate from '../middleware/authMiddleware.js'
import { validateRequest } from '../utils/validators.js'

const router = Router()
const statuses = ['Planning', 'Active', 'On Hold', 'Completed']
const validateProjectId = param('id').isMongoId().withMessage('Project ID is invalid.')

router.use(authenticate)

router.post('/',
  body('name').isString().withMessage('Project name is required.').trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be between 2 and 120 characters.'),
  body('description').optional().isString().withMessage('Description must be text.').trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters.'),
  body('status').optional().isIn(statuses).withMessage('Project status is invalid.'),
  body('members').optional().isArray({ max: 100 }).withMessage('Project members must be an array of up to 100 user IDs.'),
  body('members.*').optional().isMongoId().withMessage('A project member ID is invalid.'),
  body('startDate').optional({ nullable: true }).isISO8601({ strict: true, strictSeparator: true }).withMessage('Start date must be a valid ISO date.'),
  body('dueDate').optional({ nullable: true }).isISO8601({ strict: true, strictSeparator: true }).withMessage('Due date must be a valid ISO date.'),
  validateRequest,
  createProject,
)

router.get('/', listProjects)
router.get('/:id', validateProjectId, validateRequest, getProject)

router.put('/:id',
  validateProjectId,
  body('name').optional().isString().withMessage('Project name must be text.').trim().isLength({ min: 2, max: 120 }).withMessage('Project name must be between 2 and 120 characters.'),
  body('description').optional().isString().withMessage('Description must be text.').trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters.'),
  body('status').optional().isIn(statuses).withMessage('Project status is invalid.'),
  body('members').optional().isArray({ max: 100 }).withMessage('Project members must be an array of up to 100 user IDs.'),
  body('members.*').optional().isMongoId().withMessage('A project member ID is invalid.'),
  body('startDate').optional({ nullable: true }).isISO8601({ strict: true, strictSeparator: true }).withMessage('Start date must be a valid ISO date.'),
  body('dueDate').optional({ nullable: true }).isISO8601({ strict: true, strictSeparator: true }).withMessage('Due date must be a valid ISO date.'),
  validateRequest,
  updateProject,
)

router.delete('/:id', validateProjectId, validateRequest, deleteProject)

export default router
