import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { TOKEN_STORAGE_KEY, getApiErrorMessage } from '../services/api.js'
import AuthContext from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
    }
    window.addEventListener('taskflow:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('taskflow:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    let active = true
    async function loadCurrentUser() {
      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/auth/me')
        if (active) setUser(data.data.user)
      } catch {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadCurrentUser()
    return () => { active = false }
  }, [])

  const authenticate = useCallback(async (mode, credentials) => {
    try {
      const { data } = await api.post(`/auth/${mode}`, credentials)
      const { user: authenticatedUser, token } = data.data
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
      setUser(authenticatedUser)
      return authenticatedUser
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to sign in. Check your details and try again.'))
    }
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login: (credentials) => authenticate('login', credentials),
    register: (credentials) => authenticate('register', credentials),
    logout,
  }), [user, loading, authenticate, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
