import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Comment content is required.'],
    trim: true,
    minlength: 1,
    maxlength: 3000,
  },
}, { timestamps: true })

commentSchema.index({ task: 1, createdAt: 1 })

const Comment = mongoose.model('Comment', commentSchema)
export default Comment
