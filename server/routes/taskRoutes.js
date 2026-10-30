import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/taskController.js'
import authenticate from '../middleware/authMiddleware.js'
import { validateRequest } from '../utils/validators.js'

const router = Router()
const statuses = ['To Do', 'In Progress', 'In Review', 'Completed']
const priorities = ['Low', 'Medium', 'High', 'Urgent']
const validateTaskId = param('id').isMongoId().withMessage('Task ID is invalid.')

router.use(authenticate)

router.post('/',
  body('title').isString().withMessage('Task title is required.').trim().isLength({ min: 2, max: 200 }).withMessage('Task title must be between 2 and 200 characters.'),
  body('description').optional().isString().withMessage('Description must be text.').trim().isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters.'),
  body('project').isMongoId().withMessage('A valid project ID is required.'),
  body('assignedTo').optional({ nullable: true }).isMongoId().withMessage('Assignee ID is invalid.'),
  body('status').optional().isIn(statuses).withMessage('Task status is invalid.'),
  body('priority').optional().isIn(priorities).withMessage('Task priority is invalid.'),
  body('dueDate').optional({ nullable: true }).isISO8601({ strict: true, strictSeparator: true }).withMessage('Due date must be a valid ISO date.'),
  validateRequest,
  createTask,
)

router.get('/',
  query('project').optional().isMongoId().withMessage('Project filter must be a valid identifier.'),
  query('status').optional().isIn(statuses).withMessage('Task status filter is invalid.'),
  query('priority').optional().isIn(priorities).withMessage('Task priority filter is invalid.'),
  query('assignedTo').optional().custom((value) => value === 'me' || /^[a-f\d]{24}$/i.test(value)).withMessage('Assignee filter must be "me" or a valid user ID.'),
  validateRequest,
  listTasks,
)

router.get('/:id', validateTaskId, validateRequest, getTask)

router.put('/:id',
  validateTaskId,
  body('title').optional().isString().withMessage('Task title must be text.').trim().isLength({ min: 2, max: 200 }).withMessage('Task title must be between 2 and 200 characters.'),
  body('description').optional().isString().withMessage('Description must be text.').trim().isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters.'),
  body('project').optional().isMongoId().withMessage('Project ID is invalid.'),
  body('assignedTo').optional({ nullable: true }).isMongoId().withMessage('Assignee ID is invalid.'),
  body('status').optional().isIn(statuses).withMessage('Task status is invalid.'),
  body('priority').optional().isIn(priorities).withMessage('Task priority is invalid.'),
  body('dueDate').optional({ nullable: true }).isISO8601({ strict: true, strictSeparator: true }).withMessage('Due date must be a valid ISO date.'),
  validateRequest,
  updateTask,
)

router.delete('/:id', validateTaskId, validateRequest, deleteTask)

export default router
