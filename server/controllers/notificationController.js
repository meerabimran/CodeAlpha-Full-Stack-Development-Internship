import mongoose from 'mongoose'
import Notification from '../models/Notification.js'
import asyncHandler from '../utils/asyncHandler.js'
import { pagination, parseLimit, parsePage } from '../utils/validators.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const page = parsePage(req.query.page)
  const limit = parseLimit(req.query.limit)
  const filter = { recipient: req.user.id }
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).populate('project', 'name').populate('task', 'title')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ])
  res.status(200).json({
    success: true,
    data: { notifications, unreadCount, pagination: pagination(page, limit, total) },
  })
})

export const markNotificationRead = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Notification ID is invalid.' })
  }
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { $set: { read: true } },
    { new: true, runValidators: true },
  ).populate('project', 'name').populate('task', 'title')

  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' })
  res.status(200).json({ success: true, data: { notification } })
})
