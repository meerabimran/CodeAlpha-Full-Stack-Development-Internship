import { useState } from 'react'
import { ArrowLeft, CheckSquare, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth.js'
import LoadingState from '../components/LoadingState.jsx'

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, login, register } = useAuth()

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const credentials = {
      email: form.get('email').trim(),
      password: form.get('password'),
    }
    if (!isLogin) credentials.name = form.get('name').trim()
    try {
      await (isLogin ? login(credentials) : register(credentials))
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (user) return <Navigate to="/" replace />
  if (loading) return <LoadingState label="Checking your session…" />

  return <main className="auth-page">
    <div className="auth-topbar"><Link to="/" className="brand-lockup"><span className="brand-mark"><CheckSquare size={19} strokeWidth={2.5} /></span><span>taskflow<span className="brand-dot">.</span></span></Link><Link to={isLogin ? '/register' : '/login'} className="auth-back"><ArrowLeft size={15} />{isLogin ? 'Create account' : 'Back to sign in'}</Link></div>
    <div className="auth-layout">
      <section className="auth-form-side"><div className="auth-form-wrap"><p className="eyebrow">{isLogin ? 'WELCOME BACK' : 'GET STARTED'}</p><h1>{isLogin ? 'Good to see you again.' : 'Make work feel lighter.'}</h1><p className="auth-description">{isLogin ? 'Pick up where you left off. Your team is making moves.' : 'Bring your team, tasks, and big ideas together in one place.'}</p>
        <form className="form-stack auth-form" onSubmit={submit}>
          {!isLogin && <label>Your name<span className="input-icon"><UserRound size={17} /><input required minLength="2" maxLength="80" name="name" placeholder="Alex Morgan" autoComplete="name" /></span></label>}
          <label>Email address<span className="input-icon"><Mail size={17} /><input required type="email" name="email" placeholder="you@company.com" autoComplete="email" /></span></label>
          <label>Password<span className="input-icon"><LockKeyhole size={17} /><input required minLength={isLogin ? undefined : 8} maxLength="128" type={showPassword ? 'text' : 'password'} name="password" placeholder="At least 8 characters" autoComplete={isLogin ? 'current-password' : 'new-password'} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {isLogin && <span className="forgot-link">Use your account password to sign in.</span>}
          <button className="button button-primary auth-submit" disabled={submitting}>{submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create your account'}</button>
          {message && <p className="form-notice error-notice" role="alert">{message}</p>}
        </form>
        <p className="auth-switch">{isLogin ? 'New to TaskFlow?' : 'Already have an account?'} <button onClick={() => navigate(isLogin ? '/register' : '/login')}>{isLogin ? 'Create an account' : 'Sign in'}</button></p>
        <p className="auth-legal">By continuing, you agree to our <button onClick={() => setMessage('Terms of service will be available soon.')}>Terms</button> and <button onClick={() => setMessage('Privacy policy will be available soon.')}>Privacy Policy</button>.</p>
      </div></section>
      <aside className="auth-visual"><div className="auth-quote-mark">“</div><blockquote>Great work doesn’t happen by accident. It happens when everyone knows what matters next.</blockquote><div className="auth-quote-footer"><span className="avatar avatar-peach">JC</span><div><strong>Jamie Chen</strong><small>Design lead, Northstar Studio</small></div></div><div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" /><span className="auth-sparkle auth-sparkle-one">✳</span><span className="auth-sparkle auth-sparkle-two">✦</span></aside>
    </div>
    <footer className="auth-footer"><span>© 2026 TaskFlow</span><span>Thoughtful work, together.</span></footer>
  </main>
}
