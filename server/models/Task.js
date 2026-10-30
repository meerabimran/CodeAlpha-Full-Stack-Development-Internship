import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required.'],
    trim: true,
    minlength: 2,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000,
    default: '',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'In Review', 'Completed'],
    default: 'To Do',
    index: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
    index: true,
  },
  dueDate: {
    type: Date,
    index: true,
  },
}, { timestamps: true })

taskSchema.index({ project: 1, updatedAt: -1 })
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 })

const Task = mongoose.model('Task', taskSchema)
export default Task
