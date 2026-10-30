import mongoose from 'mongoose'
import Project from '../models/Project.js'

export function isProjectMember(project, userId) {
  const currentUserId = String(userId)
  return String(project.owner) === currentUserId ||
    project.members.some((member) => String(member) === currentUserId)
}

export async function getAccessibleProject(projectId, userId) {
  if (!mongoose.isValidObjectId(projectId)) return null
  return Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }],
  })
}
