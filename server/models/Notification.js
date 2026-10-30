import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['task_assigned', 'task_updated', 'comment_added', 'project_member_added'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 240,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true })

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
