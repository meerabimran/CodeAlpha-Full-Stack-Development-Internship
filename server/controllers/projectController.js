import mongoose from 'mongoose'
import Project from '../models/Project.js'
import User from '../models/User.js'
import Task from '../models/Task.js'
import Notification from '../models/Notification.js'
import Comment from '../models/Comment.js'
import asyncHandler from '../utils/asyncHandler.js'
import { pagination, parseLimit, parsePage } from '../utils/validators.js'

const userProjection = 'name email avatar'

function projectDatesAreValid(startDate, dueDate) {
  return !startDate || !dueDate || new Date(startDate) <= new Date(dueDate)
}

async function validateMembers(memberIds, ownerId) {
  const normalizedIds = [...new Set([String(ownerId), ...memberIds.map(String)])]
  if (normalizedIds.some((id) => !mongoose.isValidObjectId(id))) return null
  const users = await User.find({ _id: { $in: normalizedIds } }).select('_id')
  if (users.length !== normalizedIds.length) return null
  return normalizedIds
}

function populatedProject(query) {
  return query.populate('owner', userProjection).populate('members', userProjection)
}

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, members = [], startDate, dueDate } = req.body
  if (!projectDatesAreValid(startDate, dueDate)) {
    return res.status(400).json({ success: false, message: 'Project start date must be on or before its due date.' })
  }
  const validMembers = await validateMembers(members, req.user.id)
  if (!validMembers) {
    return res.status(400).json({ success: false, message: 'One or more project members are invalid.' })
  }

  const project = await Project.create({
    name,
    description,
    owner: req.user.id,
    members: validMembers,
    status,
    startDate,
    dueDate,
  })
  const populated = await populatedProject(Project.findById(project.id))
  res.status(201).json({ success: true, data: { project: populated } })
})

export const listProjects = asyncHandler(async (req, res) => {
  const page = parsePage(req.query.page)
  const limit = parseLimit(req.query.limit)
  const filter = { $or: [{ owner: req.user.id }, { members: req.user.id }] }
  const [projects, total] = await Promise.all([
    populatedProject(Project.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Project.countDocuments(filter),
  ])
  res.status(200).json({ success: true, data: { projects, pagination: pagination(page, limit, total) } })
})

export const getProject = asyncHandler(async (req, res) => {
  const project = await populatedProject(Project.findOne({
    _id: req.params.id,
    $or: [{ owner: req.user.id }, { members: req.user.id }],
  }))
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' })

  res.status(200).json({ success: true, data: { project } })
})

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, owner: req.user.id })
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or you cannot edit it.' })

  const nextStartDate = req.body.startDate === undefined ? project.startDate : req.body.startDate
  const nextDueDate = req.body.dueDate === undefined ? project.dueDate : req.body.dueDate
  if (!projectDatesAreValid(nextStartDate, nextDueDate)) {
    return res.status(400).json({ success: false, message: 'Project start date must be on or before its due date.' })
  }

  let validMembers
  if (req.body.members !== undefined) {
    validMembers = await validateMembers(req.body.members, req.user.id)
    if (!validMembers) {
      return res.status(400).json({ success: false, message: 'One or more project members are invalid.' })
    }
  }

  const previousMembers = new Set(project.members.map(String))
  const changes = ['name', 'description', 'status', 'startDate', 'dueDate']
  for (const field of changes) {
    if (req.body[field] !== undefined) project[field] = req.body[field]
  }
  if (validMembers) project.members = validMembers
  await project.save()

  if (validMembers) {
    const addedMembers = validMembers.filter((id) => id !== String(req.user.id) && !previousMembers.has(id))
    const retainedMembers = new Set(validMembers)
    const removedMembers = [...previousMembers].filter((id) => !retainedMembers.has(id))
    if (removedMembers.length) {
      await Task.updateMany(
        { project: project.id, assignedTo: { $in: removedMembers } },
        { $set: { assignedTo: null } },
      )
    }
    if (addedMembers.length) {
      await Notification.insertMany(addedMembers.map((recipient) => ({
        recipient,
        type: 'project_member_added',
        message: `You were added to project "${project.name}".`,
        project: project.id,
      })))
    }
  }

  const updatedProject = await populatedProject(Project.findById(project.id))
  res.status(200).json({ success: true, data: { project: updatedProject } })
})

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, owner: req.user.id })
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or you cannot delete it.' })

  await Promise.all([
    Comment.deleteMany({ task: { $in: await Task.find({ project: project.id }).distinct('_id') } }),
    Task.deleteMany({ project: project.id }),
    Notification.deleteMany({ project: project.id }),
    project.deleteOne(),
  ])
  res.status(200).json({ success: true, data: { id: project.id }, message: 'Project and its tasks were deleted.' })
})
