import { useEffect, useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import api, { getApiErrorMessage } from '../services/api.js'

export default function NotificationPanel({ open, onClose, onUnreadCount }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadNotifications() {
      if (!open) return
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/notifications', { params: { limit: 50 } })
        if (active) {
          setNotifications(data.data.notifications)
          onUnreadCount(data.data.unreadCount)
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Could not load notifications.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    loadNotifications()
    return () => { active = false }
  }, [open, onUnreadCount])

  useEffect(() => {
    let active = true
    async function loadUnreadCount() {
      try {
        const { data } = await api.get('/notifications', { params: { limit: 1 } })
        if (active) onUnreadCount(data.data.unreadCount)
      } catch {
        if (active) onUnreadCount(null)
      }
    }
    loadUnreadCount()
    return () => { active = false }
  }, [onUnreadCount])

  async function markAsRead(notificationId) {
    try {
      const { data } = await api.patch(`/notifications/${notificationId}/read`)
      setNotifications((current) => current.map((item) => item._id === notificationId ? data.data.notification : item))
      onUnreadCount((count) => Math.max(0, (count || 0) - 1))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not update this notification.'))
    }
  }

  return <>
    {open && <button className="notification-backdrop" aria-label="Close notifications" onClick={onClose} />}
    <aside className={`notification-panel ${open ? 'notification-panel-open' : ''}`} aria-label="Notifications" aria-hidden={!open} inert={!open}>
      <div className="notification-panel-heading"><div><h2>Notifications</h2><p>Your latest workspace updates</p></div><button className="icon-button" aria-label="Close notifications" onClick={onClose}><X size={18} /></button></div>
      {loading && <div className="notification-message"><span className="loading-spinner" />Loading notifications…</div>}
      {error && <p className="notification-error" role="alert">{error}</p>}
      {!loading && !error && !notifications.length && <div className="notification-empty"><Bell size={20} /><strong>You’re all caught up</strong><span>Updates about your projects will appear here.</span></div>}
      <div className="notification-list">{notifications.map((notification) => <article className={`notification-item ${notification.read ? '' : 'notification-unread'}`} key={notification._id}>
        <span className="notification-item-icon"><Bell size={15} /></span><div className="notification-item-copy"><p>{notification.message}</p><small>{new Date(notification.createdAt).toLocaleString()}</small>{(notification.project?.name || notification.task?.title) && <small>{notification.project?.name || notification.task?.title}</small>}</div>
        {!notification.read && <button className="icon-button notification-read-button" aria-label="Mark as read" onClick={() => markAsRead(notification._id)}><Check size={16} /></button>}
      </article>)}</div>
    </aside>
  </>
}
