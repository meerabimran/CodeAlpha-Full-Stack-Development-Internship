import { useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, FolderKanban, MoreHorizontal, Plus, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Modal from '../components/Modal.jsx'
import LoadingState from '../components/LoadingState.jsx'

export default function Projects({ projects, loading, onAddProject }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All projects')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const filtered = useMemo(() => projects.filter((project) => (status === 'All projects' || project.status === status) && project.name.toLowerCase().includes(search.toLowerCase())), [projects, search, status])

  async function submit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = data.get('name').trim()
    if (!name) {
      setError('A project name is required.')
      return
    }
    const payload = {
      name,
      description: data.get('description').trim(),
      status: data.get('status'),
      dueDate: data.get('dueDate') || undefined,
      startDate: data.get('startDate') || undefined,
    }
    setSaving(true)
    setError('')
    try {
      await onAddProject(payload)
      setOpen(false)
    } catch (requestError) {
      setError(requestError.message || 'Could not create the project.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading projects…" />

  return <div className="page-section">
    <div className="page-header"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Projects</h1><p className="page-subtitle">A shared space for great work to happen.</p></div><button className="button button-primary" onClick={() => setOpen(true)}><Plus size={17} />New project</button></div>
    <div className="toolbar"><label className="search-field"><Search size={17} /><input placeholder="Search projects..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Filter projects by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All projects</option><option>Active</option><option>Planning</option><option>On Hold</option><option>Completed</option></select><span className="result-count">{filtered.length} projects</span></div>
    {filtered.length ? <div className="projects-grid">{filtered.map((project) => <article className="project-card" key={project.id}>
      <div className="project-card-top"><div className={`project-emblem ${project.color}`}><FolderKanban size={19} /></div><MoreHorizontal size={19} className="project-card-more" aria-hidden="true" /></div>
      <div className="project-card-copy"><div className="project-title-line"><h2>{project.name}</h2><ArrowUpRight size={16} /></div><p>{project.description}</p></div>
      <div className="project-card-progress"><div><span>Progress</span><strong>{project.progress}%</strong></div><div className="progress-track"><span className={`progress-${project.color}`} style={{ width: `${project.progress}%` }} /></div></div>
      <div className="project-card-footer"><span className={`project-status status-pill-${project.status.toLowerCase().replaceAll(' ', '-')}`}>{project.status}</span><span className="project-meta"><CalendarDays size={14} />{project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}</span><span className="project-meta"><Users size={14} />{project.members.length}</span></div>
      <Link to={`/projects/${project.id}`} className="card-link" aria-label={`Open ${project.name} details`} />
    </article>)}</div> : <div className="empty-state"><div className="empty-icon"><FolderKanban size={20} /></div><h3>No projects match</h3><p>Try another search or create a new project.</p></div>}
    {open && <Modal title="Create a project" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={submit}>
      <label>Project name<input name="name" minLength="2" maxLength="120" required placeholder="e.g. Product launch" autoFocus /></label><label>Description<textarea name="description" rows="3" maxLength="2000" placeholder="What are you working on?" /></label>
      <div className="form-row"><label>Status<select name="status"><option>Planning</option><option>Active</option><option>On Hold</option><option>Completed</option></select></label><label>Start date<input name="startDate" type="date" /></label></div><label>Due date<input name="dueDate" type="date" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button><button disabled={saving} className="button button-primary">{saving ? 'Creating…' : 'Create project'}</button></div>
    </form></Modal>}
  </div>
}
