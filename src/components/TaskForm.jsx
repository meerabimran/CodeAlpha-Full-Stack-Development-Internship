import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import Modal from './Modal.jsx'

function membersFor(project, user) {
  const members = [...(project?.members || []), project?.owner, user].filter(Boolean)
  return [...new Map(members.map((member) => [member._id || member.id, member])).values()]
}

export default function TaskForm({
  projects,
  onAddTask,
  onUpdateTask,
  user,
  initialTask = null,
  defaultProjectId,
  initialStatus = 'To Do',
  iconOnly = false,
  onClose,
  triggerLabel = 'New task',
}) {
  const [open, setOpen] = useState(Boolean(initialTask))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [projectId, setProjectId] = useState(initialTask?.projectId || defaultProjectId || projects[0]?.id || '')
  const [defaultStatus] = useState(initialTask?.status || initialStatus)
  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projects, projectId])
  const members = membersFor(selectedProject, user)
  const [assigneeId, setAssigneeId] = useState(initialTask ? initialTask.assigneeId || '' : user?.id || '')

  function close() {
    setOpen(false)
    setError('')
    onClose?.()
  }

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = form.get('title').trim()
    if (title.length < 2) {
      setError('Task title must be at least 2 characters.')
      return
    }
    const payload = {
      title,
      description: form.get('description').trim(),
      project: form.get('project'),
      assignedTo: form.get('assignedTo') || null,
      status: form.get('status'),
      priority: form.get('priority'),
      dueDate: form.get('dueDate') || null,
    }
    setSaving(true)
    setError('')
    try {
      if (initialTask) await onUpdateTask(initialTask.id, payload)
      else await onAddTask(payload)
      close()
    } catch (requestError) {
      setError(requestError.message || 'Could not save this task.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    {!initialTask && <button className={`button button-primary ${iconOnly ? 'task-form-icon-trigger' : ''}`} aria-label={triggerLabel} disabled={!projects.length} onClick={() => setOpen(true)}><Plus size={17} />{!iconOnly && triggerLabel}</button>}
    {open && <Modal title={initialTask ? 'Edit task' : 'Create a task'} onClose={close}>
      {!projects.length ? <div className="empty-state"><p>Create a project before adding tasks.</p><div className="modal-actions"><button type="button" className="button button-quiet" onClick={close}>Close</button></div></div> : <form className="form-stack" onSubmit={submit}>
        <label>Task name<input name="title" minLength="2" maxLength="200" required defaultValue={initialTask?.title || ''} placeholder="e.g. Review project brief" autoFocus /></label>
        <label>Description<textarea name="description" rows="3" maxLength="5000" defaultValue={initialTask?.description || ''} placeholder="Add helpful context for your team" /></label>
        <label>Project<select name="project" value={projectId} onChange={(event) => {
          const nextProjectId = event.target.value
          const nextProject = projects.find((project) => project.id === nextProjectId)
          const nextMembers = membersFor(nextProject, user)
          setProjectId(nextProjectId)
          if (!nextMembers.some((member) => String(member._id || member.id) === String(assigneeId))) {
            setAssigneeId(user?.id || '')
          }
        }}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <div className="form-row">
          <label>Assignee<select name="assignedTo" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}><option value="">Unassigned</option>{members.map((member) => <option key={member._id || member.id} value={member._id || member.id}>{member.name || member.email || 'Project member'}</option>)}</select></label>
          <label>Priority<select name="priority" defaultValue={initialTask?.priority || 'Medium'}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
        </div>
        <div className="form-row">
          <label>Status<select name="status" key={defaultStatus} defaultValue={defaultStatus}><option>To Do</option><option>In Progress</option><option>In Review</option><option>Completed</option></select></label>
          <label>Due date<input name="dueDate" type="date" defaultValue={initialTask?.dueDate || ''} /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><button type="button" className="button button-quiet" disabled={saving} onClick={close}>Cancel</button><button disabled={saving} className="button button-primary">{saving ? 'Saving…' : initialTask ? 'Save changes' : 'Create task'}</button></div>
      </form>}
    </Modal>}
  </>
}
