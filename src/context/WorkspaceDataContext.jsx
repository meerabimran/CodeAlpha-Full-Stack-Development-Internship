import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { toApiError } from '../services/api.js'
import useAuth from './useAuth.js'
import WorkspaceDataContext from './workspaceDataContext.js'

const COLORS = ['violet', 'blue', 'amber', 'green']

function mapProject(project, index, tasks) {
  const id = project._id || project.id
  const projectTasks = tasks.filter((task) => task.projectId === id)
  const completed = projectTasks.filter((task) => task.status === 'Completed').length
  return {
    ...project,
    id,
    color: COLORS[index % COLORS.length],
    members: project.members || [],
    progress: projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0,
  }
}

function mapTask(task) {
  const project = task.project && typeof task.project === 'object' ? task.project : null
  const assignee = task.assignedTo && typeof task.assignedTo === 'object' ? task.assignedTo : null
  return {
    ...task,
    id: task._id || task.id,
    projectId: project?._id || task.project,
    projectData: project,
    project: project?.name || 'Project',
    assignee,
    assigneeId: assignee?._id || task.assignedTo || '',
    assigneeName: assignee?.name || 'Unassigned',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    comments: null,
  }
}

async function getAllPages(path) {
  const allItems = []
  let page = 1
  let pages = 1
  do {
    const { data } = await api.get(path, { params: { page, limit: 100 } })
    const payload = data.data
    const collection = payload.projects || payload.tasks
    allItems.push(...collection)
    pages = payload.pagination?.pages || 1
    page += 1
  } while (page <= pages)
  return allItems
}

export function WorkspaceDataProvider({ children }) {
  const { user } = useAuth()
  const [rawProjects, setRawProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [projectDocs, taskDocs] = await Promise.all([
        getAllPages('/projects'),
        getAllPages('/tasks'),
      ])
      const mappedTasks = taskDocs.map(mapTask)
      setTasks(mappedTasks)
      setRawProjects(projectDocs)
      return true
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your workspace. Check the API connection and try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    if (user) Promise.resolve().then(() => active && refresh())
    return () => { active = false }
  }, [user, refresh])

  const projects = useMemo(
    () => rawProjects.map((project, index) => mapProject(project, index, tasks)),
    [rawProjects, tasks],
  )

  const createProject = useCallback(async (project) => {
    try {
      const { data } = await api.post('/projects', project)
      setRawProjects((current) => [data.data.project, ...current])
      await refresh()
      return data.data.project
    } catch (error) {
      throw toApiError(error, 'Could not create the project.')
    }
  }, [refresh])

  const updateProject = useCallback(async (projectId, changes) => {
    try {
      const { data } = await api.put(`/projects/${projectId}`, changes)
      setRawProjects((current) => current.map((project) => (project._id || project.id) === projectId ? data.data.project : project))
      await refresh()
      return data.data.project
    } catch (error) {
      throw toApiError(error, 'Could not update the project.')
    }
  }, [refresh])

  const deleteProject = useCallback(async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`)
      await refresh()
    } catch (error) {
      throw toApiError(error, 'Could not delete the project.')
    }
  }, [refresh])

  const createTask = useCallback(async (task) => {
    try {
      const { data } = await api.post('/tasks', task)
      setTasks((current) => [mapTask(data.data.task), ...current])
      await refresh()
      return data.data.task
    } catch (error) {
      throw toApiError(error, 'Could not create the task.')
    }
  }, [refresh])

  const updateTask = useCallback(async (taskId, changes) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, changes)
      const updatedTask = mapTask(data.data.task)
      setTasks((current) => current.map((task) => task.id === taskId ? updatedTask : task))
      await refresh()
      return data.data.task
    } catch (error) {
      throw toApiError(error, 'Could not update the task.')
    }
  }, [refresh])

  const deleteTask = useCallback(async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      await refresh()
    } catch (error) {
      throw toApiError(error, 'Could not delete the task.')
    }
  }, [refresh])

  const value = useMemo(() => ({
    projects, tasks, loading, error, refresh,
    createProject, updateProject, deleteProject,
    createTask, updateTask, deleteTask,
  }), [projects, tasks, loading, error, refresh, createProject, updateProject, deleteProject, createTask, updateTask, deleteTask])

  return <WorkspaceDataContext.Provider value={value}>{children}</WorkspaceDataContext.Provider>
}
