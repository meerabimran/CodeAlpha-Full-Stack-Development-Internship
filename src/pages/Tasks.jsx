import { useMemo, useState } from 'react'
import { ListFilter, Search } from 'lucide-react'
import TaskForm from '../components/TaskForm.jsx'
import TaskTable from '../components/TaskTable.jsx'
import TaskDetailsModal from '../components/TaskDetailsModal.jsx'
import LoadingState from '../components/LoadingState.jsx'

export default function Tasks({ tasks, projects, user, loading, onAddTask, onUpdateTask, onDeleteTask }) {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '')
  const [status, setStatus] = useState('All statuses')
  const [priority, setPriority] = useState('Any priority')
  const [projectId, setProjectId] = useState('All projects')
  const [assigneeId, setAssigneeId] = useState('Everyone')
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)

  const assignees = useMemo(() => [...new Map(tasks.filter((task) => task.assignee).map((task) => [task.assigneeId, task.assignee])).values()], [tasks])
  const filtered = useMemo(() => tasks.filter((task) => {
    const matchesQuery = `${task.title} ${task.project} ${task.assigneeName}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery &&
      (status === 'All statuses' || task.status === status) &&
      (priority === 'Any priority' || task.priority === priority) &&
      (projectId === 'All projects' || task.projectId === projectId) &&
      (assigneeId === 'Everyone' || (assigneeId === 'Unassigned' ? !task.assigneeId : task.assigneeId === assigneeId))
  }), [tasks, query, status, priority, projectId, assigneeId])

  if (loading) return <LoadingState label="Loading tasks…" />

  return <div className="page-section">
    <div className="page-header"><div><p className="eyebrow">YOUR WORKLOAD</p><h1>Tasks</h1><p className="page-subtitle">A clear view of work in your accessible projects.</p></div><TaskForm projects={projects} user={user} onAddTask={onAddTask} /></div>
    <div className="toolbar"><label className="search-field"><Search size={17} /><input aria-label="Search tasks" placeholder="Search tasks..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><span className="filter-icon"><ListFilter size={16} /></span>
      <select aria-label="Filter by project" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="All projects">All projects</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select>
      <select aria-label="Filter by assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}><option>Everyone</option><option>Unassigned</option>{assignees.map((assignee) => <option key={assignee._id} value={assignee._id}>{assignee.name}</option>)}</select>
      <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>To Do</option><option>In Progress</option><option>In Review</option><option>Completed</option></select>
      <select aria-label="Filter by priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option>Any priority</option><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select><span className="result-count">{filtered.length} tasks</span></div>
    <section className="panel table-panel"><TaskTable tasks={filtered} onUpdateStatus={(taskId, nextStatus) => onUpdateTask(taskId, { status: nextStatus })} onOpenTask={setSelectedTask} /></section>
    {selectedTask && <TaskDetailsModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onEdit={(task) => { setSelectedTask(null); setEditingTask(task) }} onDelete={onDeleteTask} />}
    {editingTask && <TaskForm key={editingTask.id} projects={projects} user={user} initialTask={editingTask} onUpdateTask={onUpdateTask} onClose={() => setEditingTask(null)} />}
  </div>
}
