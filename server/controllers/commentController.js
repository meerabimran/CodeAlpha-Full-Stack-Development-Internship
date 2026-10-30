import Comment from '../models/Comment.js'
import Notification from '../models/Notification.js'
import Project from '../models/Project.js'
import Task from '../models/Task.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getAccessibleProject, isProjectMember } from '../utils/permissions.js'
import { pagination, parseLimit, parsePage } from '../utils/validators.js'

const authorProjection = 'name email avatar'

export const listComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId).select('project')
  if (!task || !await getAccessibleProject(task.project, req.user.id)) {
    return res.status(404).json({ success: false, message: 'Task not found.' })
  }

  const page = parsePage(req.query.page)
  const limit = parseLimit(req.query.limit)
  const [comments, total] = await Promise.all([
    Comment.find({ task: task.id }).populate('author', authorProjection)
      .sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
    Comment.countDocuments({ task: task.id }),
  ])
  res.status(200).json({ success: true, data: { comments, pagination: pagination(page, limit, total) } })
})

export const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId).populate('project', 'name owner members')
  if (!task || !isProjectMember(task.project, req.user.id)) {
    return res.status(404).json({ success: false, message: 'Task not found.' })
  }

  const comment = await Comment.create({
    task: task.id,
    author: req.user.id,
    content: req.body.content,
  })

  const recipient = task.assignedTo && String(task.assignedTo) !== String(req.user.id)
    ? String(task.assignedTo)
    : String(task.project.owner) !== String(req.user.id)
      ? String(task.project.owner)
      : null
  if (recipient) {
    await Notification.create({
      recipient,
      type: 'comment_added',
      message: `${req.user.name} commented on "${task.title}".`,
      project: task.project.id,
      task: task.id,
    })
  }

  const populatedComment = await Comment.findById(comment.id).populate('author', authorProjection)
  res.status(201).json({ success: true, data: { comment: populatedComment } })
})

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({ _id: req.params.commentId, task: req.params.taskId })
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' })

  const task = await Task.findById(req.params.taskId).select('project')
  const project = task ? await Project.findById(task.project).select('owner members') : null
  if (!project || !isProjectMember(project, req.user.id)) {
    return res.status(404).json({ success: false, message: 'Comment not found.' })
  }
  if (String(comment.author) !== String(req.user.id) && String(project.owner) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Only the comment author or project owner can delete this comment.' })
  }

  await comment.deleteOne()
  res.status(200).json({ success: true, data: { id: comment.id }, message: 'Comment was deleted.' })
})
