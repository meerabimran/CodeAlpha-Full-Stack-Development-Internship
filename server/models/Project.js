import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required.'],
    trim: true,
    minlength: 2,
    maxlength: 120,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['Planning', 'Active', 'On Hold', 'Completed'],
    default: 'Planning',
    index: true,
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
}, { timestamps: true })

projectSchema.index({ owner: 1, updatedAt: -1 })
projectSchema.index({ members: 1, updatedAt: -1 })

const Project = mongoose.model('Project', projectSchema)
export default Project
