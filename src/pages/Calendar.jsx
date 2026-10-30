import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState.jsx'
import { getTodayKey } from '../utils/date.js'

function dateLabel(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Calendar({ tasks, loading }) {
  const [filter, setFilter] = useState('All tasks')
  const today = getTodayKey()
  const days = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (!task.dueDate) return false
      if (filter === 'Upcoming') return task.dueDate >= today && task.status !== 'Completed'
      if (filter === 'Overdue') return task.dueDate < today && task.status !== 'Completed'
      if (filter === 'Completed') return task.status === 'Completed'
      return true
    })
    return Object.groupBy ? Object.groupBy(filtered, (task) => task.dueDate) : filtered.reduce((groups, task) => {
      groups[task.dueDate] = [...(groups[task.dueDate] || []), task]
      return groups
    }, {})
  }, [tasks, filter, today])
  const sortedDates = Object.keys(days).sort()

  if (loading) return <LoadingState label="Loading deadlines…" />

  return <div className="page-section">
    <div className="page-header"><div><p className="eyebrow">PLAN AHEAD</p><h1>Deadlines</h1><p className="page-subtitle">Know what’s due and give your best work room to breathe.</p></div><label className="select-with-icon"><CalendarDays size={16} /><select aria-label="Filter deadlines" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All tasks</option><option>Upcoming</option><option>Overdue</option><option>Completed</option></select></label></div>
    <section className="deadline-summary">
      <article><span className="deadline-summary-icon stat-amber"><Clock3 size={18} /></span><div><small>Upcoming</small><strong>{tasks.filter((task) => task.dueDate >= today && task.status !== 'Completed').length}</strong></div></article>
      <article><span className="deadline-summary-icon stat-red"><CalendarDays size={18} /></span><div><small>Overdue</small><strong>{tasks.filter((task) => task.dueDate < today && task.status !== 'Completed').length}</strong></div></article>
      <article><span className="deadline-summary-icon stat-green"><CheckCircle2 size={18} /></span><div><small>Completed</small><strong>{tasks.filter((task) => task.status === 'Completed').length}</strong></div></article>
    </section>
    {sortedDates.length ? <div className="deadline-timeline">{sortedDates.map((date) => <section className="timeline-day" key={date}><div className="timeline-date"><span className={`timeline-marker ${date < today ? 'marker-overdue' : ''}`} /><strong>{dateLabel(date)}</strong>{date === today && <span className="today-pill">Today</span>}</div><div className="timeline-tasks">{days[date].map((task) => <article className="timeline-task" key={task.id}><span className={`timeline-task-icon ${task.status === 'Completed' ? 'timeline-complete' : ''}`}>{task.status === 'Completed' ? <CheckCircle2 size={17} /> : <CalendarDays size={17} />}</span><div className="timeline-task-copy"><strong>{task.title}</strong><small>{task.project} <span>·</span> {task.assigneeName}</small></div><span className={`priority priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span><span className={`project-status status-pill-${task.status.toLowerCase().replaceAll(' ', '-')}`}>{task.status}</span></article>)}</div></section>)}</div> : <div className="empty-state"><div className="empty-icon"><CalendarDays size={20} /></div><h3>No deadlines found</h3><p>There are no tasks in this view right now.</p><Link className="text-link" to="/tasks">View tasks →</Link></div>}
  </div>
}
