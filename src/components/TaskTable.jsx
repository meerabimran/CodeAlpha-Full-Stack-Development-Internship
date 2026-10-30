import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { getTodayKey } from '../utils/date.js'

function formatDate(value) {
  if (!value) return 'No date'
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TaskTable({ tasks, onUpdateStatus, onOpenTask }) {
  const [updating, setUpdating] = useState('')
  const [error, setError] = useState('')
  async function updateStatus(taskId, status) {
    setUpdating(taskId)
    setError('')
    try {
      await onUpdateStatus(taskId, status)
    } catch (requestError) {
      setError(requestError.message || 'Could not update task status.')
    } finally {
      setUpdating('')
    }
  }
  if (!tasks.length) return <><div className="empty-state"><div className="empty-icon">✓</div><h3>No tasks found</h3><p>Try changing your filters or create a new task.</p></div>{error && <p className="form-error table-action-error" role="alert">{error}</p>}</>
  return (
    <div className="table-scroll">
      {error && <p className="form-error table-action-error" role="alert">{error}</p>}
      <table className="task-table">
        <thead><tr><th>Task name</th><th>Project</th><th>Assignee</th><th>Due date</th><th>Priority</th><th>Status</th><th aria-label="Actions" /></tr></thead>
        <tbody>{tasks.map((task) => <tr key={task.id}>
          <td><div className="task-name-cell"><span className={`task-check ${task.status === 'Completed' ? 'is-checked' : ''}`}>{task.status === 'Completed' ? '✓' : ''}</span><span><strong>{task.title}</strong><small><MessageCircle size={12} />{task.comments ?? 'Open discussion'}</small></span></div></td>
          <td><span className="table-project"><span className="project-dot violet-dot" />{task.project}</span></td>
          <td><span className="assignee-cell"><span className={`avatar avatar-${task.assigneeId ? 'user' : 'teammate'}`}>{task.assigneeName.split(' ').map((part) => part[0]).join('')}</span>{task.assigneeName.split(' ')[0]}</span></td>
          <td className={task.dueDate && task.dueDate < getTodayKey() && task.status !== 'Completed' ? 'overdue-text' : ''}>{formatDate(task.dueDate)}</td>
          <td><span className={`priority priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span></td>
          <td><select disabled={updating === task.id} className={`status-select status-${task.status.toLowerCase().replaceAll(' ', '-')}`} aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => updateStatus(task.id, event.target.value)}><option>To Do</option><option>In Progress</option><option>In Review</option><option>Completed</option></select></td>
          <td><button className="icon-button table-more" aria-label={`Open ${task.title}`} onClick={() => onOpenTask?.(task)}><MessageCircle size={17} /></button></td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}
