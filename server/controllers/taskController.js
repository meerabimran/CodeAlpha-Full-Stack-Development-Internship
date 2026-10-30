import mongoose from 'mongoose'
import Comment from '../models/Comment.js'
import Notification from '../models/Notification.js'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getAccessibleProject, isProjectMember } from '../utils/permissions.js'
import { pagination, parseLimit, parsePage } from '../utils/validators.js'

const userProjection = 'name email avatar'

function populatedTask(query) {
  return query
    .populate('assignedTo', userProjection)
    .populate('createdBy', userProjection)
    .populate('project', 'name owner members')
}

async function validAssignment(project, assignedTo) {
  if (assignedTo === null || assignedTo === undefined || assignedTo === '') return null
  if (!mongoose.isValidObjectId(assignedTo)) return false
  const memberIds = [String(project.owner), ...project.members.map(String)]
  if (!memberIds.includes(String(assignedTo))) return false
  return String(assignedTo)
}

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, project: projectId, assignedTo, status, priority, dueDate } = req.body
  const project = await getAccessibleProject(projectId, req.user.id)
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or you do not have access.' })

  const assignment = await validAssignment(project, assignedTo)
  if (assignment === false) {
    return res.status(400).json({ success: false, message: 'Assigned user must be a member of this project.' })
  }

  const task = await Task.create({
    title,
    description,
    project: project.id,
    assignedTo: assignment,
    createdBy: req.user.id,
    status,
    priority,
    dueDate,
  })

  if (assignment && assignment !== String(req.user.id)) {
    await Notification.create({
      recipient: assignment,
      type: 'task_assigned',
      message: `You were assigned to "${task.title}".`,
      project: project.id,
      task: task.id,
    })
  }

  const populated = await populatedTask(Task.findById(task.id))
  res.status(201).json({ success: true, data: { task: populated } })
})

export const listTasks = asyncHandler(async (req, res) => {
  const accessibleProjects = await Project.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] }).distinct('_id')
  const filter = { project: { $in: accessibleProjects } }
  if (req.query.project) {
    if (!mongoose.isValidObjectId(req.query.project)) {
      return res.status(400).json({ success: false, message: 'Project filter must be a valid identifier.' })
    }
    filter.project = accessibleProjects.some((projectId) => String(projectId) === req.query.project)
      ? req.query.project
      : { $in: [] }
  }
  if (req.query.status) filter.status = req.query.status
  if (req.query.priority) filter.priority = req.query.priority
  if (req.query.assignedTo === 'me') filter.assignedTo = req.user.id
  else if (req.query.assignedTo) {
    if (!mongoose.isValidObjectId(req.query.assignedTo)) {
      return res.status(400).json({ success: false, message: 'Assignee filter must be a valid identifier.' })
    }
    filter.assignedTo = req.query.assignedTo
  }

  const page = parsePage(req.query.page)
  const limit = parseLimit(req.query.limit)
  const [tasks, total] = await Promise.all([
    populatedTask(Task.find(filter).sort({ dueDate: 1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Task.countDocuments(filter),
  ])
  res.status(200).json({ success: true, data: { tasks, pagination: pagination(page, limit, total) } })
})

export const getTask = asyncHandler(async (req, res) => {
  const task = await populatedTask(Task.findById(req.params.id))
  if (!task || !isProjectMember(task.project, req.user.id)) {
    return res.status(404).json({ success: false, message: 'Task not found.' })
  }
  res.status(200).json({ success: true, data: { task } })
})

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' })

  const currentProject = await getAccessibleProject(task.project, req.user.id)
  if (!currentProject) return res.status(404).json({ success: false, message: 'Task not found.' })

  const nextProjectId = req.body.project || String(task.project)
  const nextProject = nextProjectId === String(task.project)
    ? currentProject
    : await getAccessibleProject(nextProjectId, req.user.id)
  if (!nextProject) return res.status(404).json({ success: false, message: 'Project not found or you do not have access.' })

  const nextAssignee = req.body.assignedTo === undefined ? task.assignedTo : req.body.assignedTo
  const assignment = await validAssignment(nextProject, nextAssignee)
  if (assignment === false) {
    return res.status(400).json({ success: false, message: 'Assigned user must be a member of this project.' })
  }

  const previousAssignee = task.assignedTo ? String(task.assignedTo) : null
  const taskFieldsChanged = ['title', 'description', 'status', 'priority', 'dueDate']
    .some((field) => req.body[field] !== undefined && String(req.body[field]) !== String(task[field]))
  const projectChanged = nextProject.id !== String(task.project)
  for (const field of ['title', 'description', 'status', 'priority', 'dueDate']) {
    if (req.body[field] !== undefined) task[field] = req.body[field]
  }
  task.project = nextProject.id
  task.assignedTo = assignment
  await task.save()

  if (assignment && assignment !== String(req.user.id) && assignment !== previousAssignee) {
    await Notification.create({
      recipient: assignment,
      type: 'task_assigned',
      message: `You were assigned to "${task.title}".`,
      project: nextProject.id,
      task: task.id,
    })
  } else if (previousAssignee && previousAssignee !== String(req.user.id) &&
      (taskFieldsChanged || projectChanged || assignment !== previousAssignee)) {
    await Notification.create({
      recipient: previousAssignee,
      type: 'task_updated',
      message: `"${task.title}" was updated.`,
      project: nextProject.id,
      task: task.id,
    })
  }

  const populated = await populatedTask(Task.findById(task.id))
  res.status(200).json({ success: true, data: { task: populated } })
})

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' })
  const project = await getAccessibleProject(task.project, req.user.id)
  if (!project) return res.status(404).json({ success: false, message: 'Task not found.' })

  await Promise.all([
    Comment.deleteMany({ task: task.id }),
    Notification.deleteMany({ task: task.id }),
    task.deleteOne(),
  ])
  res.status(200).json({ success: true, data: { id: task.id }, message: 'Task was deleted.' })
})
