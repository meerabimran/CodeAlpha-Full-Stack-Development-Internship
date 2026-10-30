import { LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'

export default function Profile({ user }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  function signOut() {
    logout()
    navigate('/login', { replace: true })
  }
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return <div className="page-section">
    <div className="page-header"><div><p className="eyebrow">ACCOUNT SETTINGS</p><h1>My profile</h1><p className="page-subtitle">Your TaskFlow account information.</p></div><button className="button button-quiet" onClick={signOut}><LogOut size={16} />Sign out</button></div>
    <section className="panel profile-panel"><div className="profile-panel-heading"><span className="avatar avatar-user profile-large">{initials}</span><div><h2>{user.name}</h2><p>Profile details returned by your account.</p></div></div>
      <div className="profile-form form-stack"><label>Full name<input readOnly value={user.name} /></label><label>Email address<input readOnly type="email" value={user.email} /></label><label>Avatar<input readOnly value={user.avatar || 'No profile image set'} /></label><p className="profile-readonly-note"><UserRound size={15} /> Profile editing is not available in the current API.</p></div>
    </section>
  </div>
}
