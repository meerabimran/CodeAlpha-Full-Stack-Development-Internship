import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, FolderKanban, Pencil, Trash2, Users } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { getApiErrorMessage } from '../services/api.js'
import Modal from '../components/Modal.jsx'
import LoadingState from '../components/LoadingState.jsx'
import TaskForm from '../components/TaskForm.jsx'
import TaskDetailsModal from '../components/TaskDetailsModal.jsx'
import TaskTable from '../components/TaskTable.jsx'

export default function ProjectDetails({ projects, tasks, loading, user, onUpdateProject, onDeleteProject, onAddTask, onUpdateTask, onDeleteTask }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const projectSummary = projects.find((item) => item.id === id)
  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === id), [tasks, id])
  const progress = projectTasks.length
    ? Math.round((projectTasks.filter((task) => task.status === 'Completed').length / projectTasks.length) * 100)
    : 0

  useEffect(() => {
    let active = true
    async function loadProject() {
      setFetching(true)
      setError('')
      try {
        const { data } = await api.get(`/projects/${id}`)
        if (active) setProject(data.data.project)
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Could not load this project.'))
      } finally {
        if (active) setFetching(false)
      }
    }
    loadProject()
    return () => { active = false }
  }, [id])

  async function saveProject(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      name: form.get('name').trim(),
      description: form.get('description').trim(),
      status: form.get('status'),
      startDate: form.get('startDate') || null,
      dueDate: form.get('dueDate') || null,
    }
    setSaving(true)
    setError('')
    try {
      const updated = await onUpdateProject(id, payload)
      setProject(updated)
      setEditing(false)
    } catch (requestError) {
      setError(requestError.message || 'Could not update this project.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProject() {
    if (!window.confirm(`Delete "${project.name}" and all its tasks and comments? This cannot be undone.`)) return
    setError('')
    try {
      await onDeleteProject(id)
      navigate('/projects', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Could not delete this project.')
    }
  }

  if (fetching || (loading && !project)) return <LoadingState label="Loading project…" />
  if (!project) return <div className="page-section"><div className="page-alert error-alert" role="alert">{error || 'Project not found or you do not have access.'}</div><Link to="/projects" className="button button-quiet"><ArrowLeft size={15} />Back to projects</Link></div>

  const ownerId = project.owner?._id || project.owner
  const isOwner = String(ownerId) === String(user.id)
  const members = [...new Map([...(project.members || []), project.owner].filter(Boolean).map((member) => [member._id || member.id, member])).values()]

  return <div className="page-section">
    <Link to="/projects" className="back-link"><ArrowLeft size={15} />All projects</Link>
    <div className="project-detail-header"><div><p className="eyebrow">PROJECT DETAILS</p><h1>{project.name}</h1><p className="page-subtitle">{project.description || 'No project description.'}</p></div><div className="project-detail-actions">
      <TaskForm projects={projects} user={user} defaultProjectId={id} onAddTask={onAddTask} />
      {isOwner && <><button className="button button-quiet" onClick={() => setEditing(true)}><Pencil size={15} />Edit</button><button className="button button-quiet danger-button" onClick={deleteProject}><Trash2 size={15} />Delete</button></>}
    </div></div>
    {error && <div className="page-alert error-alert" role="alert">{error}</div>}
    <section className="project-detail-stats">
      <article><span className={`project-emblem ${projectSummary?.color || 'violet'}`}><FolderKanban size={18} /></span><div><small>Status</small><span className={`project-status status-pill-${project.status.toLowerCase().replaceAll(' ', '-')}`}>{project.status}</span></div></article>
      <article><span className="project-emblem blue"><CalendarDays size={18} /></span><div><small>Due date</small><strong>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}</strong></div></article>
      <article><span className="project-emblem green"><Users size={18} /></span><div><small>Project members</small><strong>{members.length}</strong></div></article>
      <article><span className="project-emblem amber"><FolderKanban size={18} /></span><div><small>Task progress</small><strong>{progress}%</strong></div></article>
    </section>
    <div className="project-detail-grid">
      <section className="panel project-members-panel"><div className="panel-heading"><div><h2>Members</h2><p>People with access to this project</p></div></div>
        <div className="project-member-list">{members.map((member) => <div className="project-member" key={member._id || member.id}><span className="avatar avatar-user">{member.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'}</span><div><strong>{member.name || 'Project member'}</strong><small>{member.email || ''}</small></div>{String(member._id || member.id) === String(ownerId) && <span className="owner-tag">Owner</span>}</div>)}</div>
        {!isOwner && <p className="members-note">Only the project owner can edit project details or membership.</p>}
      </section>
      <section className="panel project-detail-progress"><div className="panel-heading"><div><h2>Progress</h2><p>Completion based on task status</p></div><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><p>{projectTasks.filter((task) => task.status === 'Completed').length} of {projectTasks.length} tasks completed</p></section>
    </div>
    <section className="panel project-tasks-panel"><div className="panel-heading"><div><h2>Project tasks</h2><p>Tasks associated with this project</p></div></div><TaskTable tasks={projectTasks} onUpdateStatus={(taskId, status) => onUpdateTask(taskId, { status })} onOpenTask={setSelectedTask} /></section>
    {editing && <Modal title="Edit project" onClose={() => setEditing(false)}><form className="form-stack" onSubmit={saveProject}>
      <label>Project name<input name="name" required minLength="2" maxLength="120" defaultValue={project.name} /></label>
      <label>Description<textarea name="description" rows="3" maxLength="2000" defaultValue={project.description || ''} /></label>
      <div className="form-row"><label>Status<select name="status" defaultValue={project.status}><option>Planning</option><option>Active</option><option>On Hold</option><option>Completed</option></select></label><label>Start date<input name="startDate" type="date" defaultValue={project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : ''} /></label></div>
      <label>Due date<input name="dueDate" type="date" defaultValue={project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : ''} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" disabled={saving} onClick={() => setEditing(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form></Modal>}
    {selectedTask && <TaskDetailsModal task={selectedTask} user={user} onClose={() => setSelectedTask(null)} onEdit={(task) => { setSelectedTask(null); setEditingTask(task) }} onDelete={onDeleteTask} />}
    {editingTask && <TaskForm key={editingTask.id} projects={projects} user={user} initialTask={editingTask} onUpdateTask={onUpdateTask} onClose={() => setEditingTask(null)} />}
  </div>
}
