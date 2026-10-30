import { useMemo, useState } from 'react'
import { CalendarDays, MessageCircle, SlidersHorizontal } from 'lucide-react'
import TaskForm from '../components/TaskForm.jsx'
import TaskDetailsModal from '../components/TaskDetailsModal.jsx'
import LoadingState from '../components/LoadingState.jsx'

const columns = ['To Do', 'In Progress', 'In Review', 'Completed']

export default function Board({ tasks, projects, user, loading, onAddTask, onUpdateStatus, onUpdateTask, onDeleteTask }) {
  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('All projects')
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [updating, setUpdating] = useState('')
  const [error, setError] = useState('')
  const visible = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()) && (projectFilter === 'All projects' || task.projectId === projectFilter)), [tasks, query, projectFilter])

  async function changeStatus(taskId, status) {
    setUpdating(taskId)
    setError('')
    try {
      await onUpdateStatus(taskId, status)
    } catch (requestError) {
      setError(requestError.message || 'Could not save this task status.')
    } finally {
      setUpdating('')
    }
  }

  if (loading) return <LoadingState label="Loading your board…" />

  return <div className="page-section board-page">
    <div className="page-header"><div><p className="eyebrow">PROJECT WORKFLOW</p><h1>Kanban board</h1><p className="page-subtitle">Move work forward, one card at a time.</p></div><TaskForm projects={projects} user={user} onAddTask={onAddTask} /></div>
    <div className="board-toolbar"><div className="board-project-select"><span className="project-dot violet-dot" /><select aria-label="Select project" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="All projects">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div><label className="search-field board-search"><SlidersHorizontal size={16} /><input placeholder="Filter cards..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    {error && <div className="page-alert error-alert" role="alert">{error}</div>}
    {!projects.length && <div className="empty-state"><h3>No projects available</h3><p>Create a project before adding or assigning tasks.</p></div>}
    <div className="kanban-columns">{columns.map((column, index) => {
      const columnTasks = visible.filter((task) => task.status === column)
      return <section className="kanban-column" key={column}><div className="kanban-heading"><div><span className={`column-dot column-${index}`} /><h2>{column}</h2><span className="column-count">{columnTasks.length}</span></div><TaskForm projects={projects} user={user} defaultProjectId={projectFilter === 'All projects' ? projects[0]?.id : projectFilter} initialStatus={column} iconOnly triggerLabel={`Add task to ${column}`} onAddTask={onAddTask} /></div>
        <div className="kanban-card-list">{columnTasks.map((task) => <article className="kanban-card" key={task.id}><div className="kanban-card-project"><span className="project-dot violet-dot" />{task.project}<button className="card-dots" aria-label={`Open ${task.title}`} onClick={() => setSelectedTask(task)}>···</button></div><button className="kanban-task-title" onClick={() => setSelectedTask(task)}>{task.title}</button><div className="kanban-card-badges"><span className={`priority priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span><select disabled={updating === task.id} className={`status-select status-${task.status.toLowerCase().replaceAll(' ', '-')}`} aria-label={`Change status for ${task.title}`} value={task.status} onChange={(event) => changeStatus(task.id, event.target.value)}>{columns.map((status) => <option key={status}>{status}</option>)}</select></div><div className="kanban-card-footer"><span className={`avatar avatar-${task.assigneeId ? 'user' : 'teammate'}`}>{task.assigneeName.split(' ').map((part) => part[0]).join('')}</span><span className={task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'Completed' ? 'overdue-text' : ''}><CalendarDays size={13} />{task.dueDate ? new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span><span><MessageCircle size={13} /></span></div></article>)}
          {!columnTasks.length && <div className="column-empty">No tasks here yet</div>}</div>
      </section>
    })}</div>
    {selectedTask && <TaskDetailsModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onEdit={(task) => { setSelectedTask(null); setEditingTask(task) }} onDelete={onDeleteTask} />}
    {editingTask && <TaskForm key={editingTask.id} projects={projects} user={user} initialTask={editingTask} onUpdateTask={onUpdateTask} onClose={() => setEditingTask(null)} />}
  </div>
}
