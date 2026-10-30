import { useEffect, useState } from 'react'
import { CalendarDays, MessageCircle, Pencil, Send, Trash2 } from 'lucide-react'
import api, { getApiErrorMessage } from '../services/api.js'
import Modal from './Modal.jsx'
import LoadingState from './LoadingState.jsx'

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
}

export default function TaskDetailsModal({ task, user, onClose, onEdit, onDelete }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [taskData, setTaskData] = useState(task)

  useEffect(() => {
    let active = true
    async function loadDetails() {
      setLoading(true)
      setError('')
      try {
        const [taskResponse, commentsResponse] = await Promise.all([
          api.get(`/tasks/${task.id}`),
          api.get(`/tasks/${task.id}/comments`, { params: { limit: 100 } }),
        ])
        if (active) {
          const taskDocument = taskResponse.data.data.task
          const project = taskDocument.project && typeof taskDocument.project === 'object' ? taskDocument.project : null
          const assignee = taskDocument.assignedTo && typeof taskDocument.assignedTo === 'object' ? taskDocument.assignedTo : null
          setTaskData({
            ...taskDocument,
            id: taskDocument._id,
            projectId: project?._id || taskDocument.project,
            assigneeId: assignee?._id || '',
            dueDate: taskDocument.dueDate ? new Date(taskDocument.dueDate).toISOString().slice(0, 10) : '',
          })
          setComments(commentsResponse.data.data.comments)
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Could not load this task.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    loadDetails()
    return () => { active = false }
  }, [task.id])

  async function submitComment(event) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      setError('Write a comment before posting.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post(`/tasks/${task.id}/comments`, { content: trimmed })
      setComments((current) => [...current, data.data.comment])
      setContent('')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not post your comment.'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteComment(comment) {
    if (!window.confirm('Delete this comment?')) return
    setDeleting(comment._id)
    setError('')
    try {
      await api.delete(`/tasks/${task.id}/comments/${comment._id}`)
      setComments((current) => current.filter((item) => item._id !== comment._id))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not delete the comment.'))
    } finally {
      setDeleting('')
    }
  }

  async function deleteTask() {
    if (!window.confirm(`Delete "${task.title}"? This will also delete its comments.`)) return
    setError('')
    try {
      await onDelete(task.id)
      onClose()
    } catch (requestError) {
      setError(requestError.message || 'Could not delete this task.')
    }
  }

  const ownerId = taskData.project?.owner?._id || taskData.project?.owner
  const canDeleteComment = (comment) => comment.author?._id === user.id || ownerId === user.id

  return <Modal title="Task discussion" onClose={onClose}>
    {loading ? <LoadingState label="Loading task and comments…" /> : <>
      <div className="task-detail-heading"><div><p className="eyebrow">{taskData.project?.name || task.project}</p><h3>{taskData.title}</h3></div><div className="task-detail-actions"><button className="button button-quiet" onClick={() => onEdit(taskData)}><Pencil size={14} />Edit</button><button className="icon-button task-delete-button" aria-label="Delete task" onClick={deleteTask}><Trash2 size={16} /></button></div></div>
      {taskData.description && <p className="task-detail-description">{taskData.description}</p>}
      <div className="task-detail-meta"><span className={`project-status status-pill-${taskData.status?.toLowerCase().replaceAll(' ', '-')}`}>{taskData.status}</span><span className={`priority priority-${taskData.priority?.toLowerCase()}`}><i />{taskData.priority}</span><span><CalendarDays size={13} />{taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString() : 'No due date'}</span><span>{taskData.assignedTo?.name || 'Unassigned'}</span></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="comments-section"><div className="comments-heading"><h3><MessageCircle size={15} />Comments</h3><span>{comments.length}</span></div>
        {comments.length ? <div className="comment-list">{comments.map((comment) => <article className="comment-item" key={comment._id}><span className="avatar avatar-teammate">{initials(comment.author?.name)}</span><div className="comment-body"><div className="comment-meta"><strong>{comment.author?.name || 'Workspace member'}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time></div><p>{comment.content}</p></div>{canDeleteComment(comment) && <button className="icon-button comment-delete" disabled={deleting === comment._id} aria-label="Delete comment" onClick={() => deleteComment(comment)}><Trash2 size={14} /></button>}</article>)}</div> : <p className="comments-empty">No comments yet. Start the conversation.</p>}
        <form className="comment-form" onSubmit={submitComment}><label className="sr-only" htmlFor="task-comment">Add a comment</label><textarea id="task-comment" rows="2" maxLength="3000" placeholder="Write a comment…" value={content} onChange={(event) => setContent(event.target.value)} /><button className="button button-primary" disabled={saving || !content.trim()}><Send size={14} />{saving ? 'Posting…' : 'Post'}</button></form>
      </section>
    </>}
  </Modal>
}
