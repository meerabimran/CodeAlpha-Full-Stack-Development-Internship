import { useState } from 'react'
import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import {
  Bell, CalendarDays, CheckSquare, ChevronDown, CircleHelp, LayoutDashboard,
  Columns3, Menu, Plus, Search, Settings, Users, X, Zap,
} from 'lucide-react'
import NotificationPanel from './NotificationPanel.jsx'

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: Users },
  { label: 'My tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Board', path: '/board', icon: Columns3 },
  { label: 'Deadlines', path: '/calendar', icon: CalendarDays },
]

const pageNames = {
  '/': 'Overview',
  '/projects': 'Projects',
  '/tasks': 'My tasks',
  '/board': 'Board',
  '/calendar': 'Deadlines',
  '/profile': 'My profile',
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
}

export default function WorkspaceLayout({ children, taskCount, user, projects }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageNames[location.pathname] || 'TaskFlow'

  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><CheckSquare size={19} strokeWidth={2.5} /></div>
          <span>taskflow<span className="brand-dot">.</span></span>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={18} /></button>
        </div>
        <button className="workspace-switcher">
          <span className="workspace-avatar">{initials(user?.name)}</span>
          <span className="workspace-copy"><strong>{user?.name || 'My workspace'}</strong><small>{user?.email || 'TaskFlow workspace'}</small></span>
          <ChevronDown size={16} />
        </button>
        <button className="create-button" onClick={() => navigate('/tasks')}><Plus size={17} /> Create new</button>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>
              {path === '/tasks' && <span className="nav-count">{taskCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="sidebar-section-heading"><span>YOUR PROJECTS</span><button aria-label="View projects" onClick={() => navigate('/projects')}><Plus size={16} /></button></div>
          {projects.slice(0, 3).map((project) => <NavLink to={`/projects/${project.id}`} className="project-shortcut" key={project.id}><span className={`project-dot ${project.color}-dot`} />{project.name}</NavLink>)}
          {!projects.length && <span className="project-shortcut sidebar-empty-projects">No projects yet</span>}
        </div>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Zap size={16} fill="currentColor" /></div>
            <strong>Make room for more</strong>
            <p>Upgrade your workspace to unlock more projects.</p>
            <button onClick={() => window.alert('Workspace plans will be available in a future version.')}>Explore plans <span>→</span></button>
          </div>
          <NavLink to="/profile" className="profile-link">
            <span className="avatar avatar-user">{initials(user?.name)}</span>
            <span className="profile-copy"><strong>{user?.name}</strong><small>{user?.email}</small></span>
            <Settings size={17} />
          </NavLink>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>{title}</strong></div>
          <div className="topbar-actions">
            <label className="top-search">
              <Search size={16} />
              <input aria-label="Search" placeholder="Search anything..." onKeyDown={(event) => {
                if (event.key === 'Enter' && event.currentTarget.value.trim()) navigate(`/tasks?q=${encodeURIComponent(event.currentTarget.value.trim())}`)
              }} />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button notification-button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((current) => !current)}><Bell size={19} />{unreadCount > 0 && <span />}</button>
            <button className="icon-button help-button" aria-label="Help" onClick={() => window.alert('TaskFlow help center coming soon.')}><CircleHelp size={19} /></button>
            <span className="avatar avatar-user top-avatar">{initials(user?.name)}</span>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} onUnreadCount={setUnreadCount} />
    </div>
  )
}
