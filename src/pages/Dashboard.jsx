import { ArrowRight, Check, Clock3, FolderKanban, ListTodo, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import TaskTable from '../components/TaskTable.jsx'
import TaskForm from '../components/TaskForm.jsx'
import TaskDetailsModal from '../components/TaskDetailsModal.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { getCurrentDate } from '../utils/date.js'

function formatDate(value) {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Dashboard({ projects, tasks, user, loading, onAddTask, onUpdateStatus, onUpdateTask, onDeleteTask }) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  if (loading) return <LoadingState label="Loading your workspace…" />

  const completed = tasks.filter((task) => task.status === 'Completed').length
  const inProgress = tasks.filter((task) => task.status === 'In Progress').length
  const assignedToMe = tasks.filter((task) => task.assigneeId === user.id)
  const upcoming = tasks.filter((task) => task.dueDate && task.status !== 'Completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4)
  const firstName = user.name.split(' ')[0]
  const today = getCurrentDate()

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div><p className="eyebrow">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</p><h1>Welcome, {firstName}<span className="wave">✦</span></h1><p className="page-subtitle">Here’s what’s happening across your workspace.</p></div>
        <div className="welcome-actions"><TaskForm projects={projects} user={user} onAddTask={onAddTask} triggerLabel="New task" /><Link className="button button-quiet welcome-action" to="/projects"><Plus size={17} /> New project</Link></div>
      </section>

      <section className="stat-grid" aria-label="Workspace statistics">
        <article className="stat-card"><div className="stat-top"><span className="stat-icon stat-violet"><FolderKanban size={18} /></span></div><p>Projects</p><strong>{projects.length}</strong><small>you can access</small></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-icon stat-blue"><ListTodo size={18} /></span></div><p>Tasks assigned to me</p><strong>{assignedToMe.length}</strong><small>across your projects</small></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-icon stat-green"><Check size={18} /></span></div><p>Tasks completed</p><strong>{completed}<small className="stat-total"> / {tasks.length}</small></strong><small>in your projects</small></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-icon stat-amber"><Clock3 size={18} /></span></div><p>In progress</p><strong>{inProgress}</strong><small>across all projects</small></article>
      </section>

      <section className="dashboard-main-grid">
        <div className="panel projects-panel">
          <div className="panel-heading"><div><h2>Project progress</h2><p>Progress calculated from completed tasks</p></div><Link to="/projects" className="text-link">All projects <ArrowRight size={15} /></Link></div>
          {projects.length ? <div className="project-progress-list">{projects.slice(0, 4).map((project) => <div className="project-progress-item" key={project.id}>
            <div className={`project-emblem ${project.color}`}><FolderKanban size={18} /></div>
            <div className="project-progress-copy"><div><strong>{project.name}</strong><span>{project.progress}%</span></div><div className="progress-track"><span style={{ width: `${project.progress}%` }} className={`progress-${project.color}`} /></div><small>{project.status} <span>·</span> Due {formatDate(project.dueDate)}</small></div>
          </div>)}</div> : <div className="empty-state"><div className="empty-icon"><FolderKanban size={20} /></div><h3>No projects yet</h3><p>Create a project to start organizing team work.</p><Link className="text-link" to="/projects">Create a project →</Link></div>}
        </div>
        <div className="panel deadlines-panel">
          <div className="panel-heading"><div><h2>Upcoming deadlines</h2><p>From your open tasks</p></div><Link to="/calendar" className="icon-button panel-calendar" aria-label="View all deadlines"><ArrowRight size={17} /></Link></div>
          {upcoming.length ? <div className="deadline-list">{upcoming.map((task, index) => <div className="deadline-item" key={task.id}><div className={`deadline-date ${index === 0 ? 'deadline-soon' : ''}`}><strong>{new Date(`${task.dueDate}T12:00:00`).getDate()}</strong><small>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</small></div><div className="deadline-copy"><strong>{task.title}</strong><small>{task.project}</small></div><span className={`priority priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span></div>)}</div> : <div className="empty-state"><div className="empty-icon"><Clock3 size={20} /></div><h3>No upcoming deadlines</h3><p>Tasks with due dates will appear here.</p></div>}
          <Link to="/calendar" className="deadlines-footer">View all deadlines <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="panel recent-tasks-panel">
          <div className="panel-heading"><div><h2>My tasks</h2><p>Your tasks assigned across accessible projects</p></div><Link to="/tasks" className="text-link">View all <ArrowRight size={15} /></Link></div>
          <TaskTable tasks={assignedToMe.slice(0, 5)} onUpdateStatus={onUpdateStatus} onOpenTask={setSelectedTask} />
        </div>
        <div className="panel activity-panel">
          <div className="panel-heading"><div><h2>Recent activity</h2><p>Activity history is not available yet</p></div></div>
          <div className="empty-state"><div className="empty-icon"><Clock3 size={20} /></div><h3>No activity feed</h3><p>The API does not currently record project activity.</p></div>
        </div>
      </section>
      {selectedTask && <TaskDetailsModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onEdit={(task) => { setSelectedTask(null); setEditingTask(task) }} onDelete={onDeleteTask} />}
      {editingTask && <TaskForm key={editingTask.id} projects={projects} user={user} initialTask={editingTask} onUpdateTask={onUpdateTask} onClose={() => setEditingTask(null)} />}
    </div>
  )
}
