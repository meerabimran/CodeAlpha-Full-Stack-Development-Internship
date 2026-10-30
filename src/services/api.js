import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'taskflow_token'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ''),
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.localStorage.getItem(TOKEN_STORAGE_KEY)) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('taskflow:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.response?.data?.message) return error.response.data.message
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.'
  if (error.response?.status >= 500) return 'The server is temporarily unavailable. Please try again later.'
  if (!error.response) return 'Could not reach the server. Check your connection and try again.'
  return fallback
}

export function toApiError(error, fallback) {
  return new Error(getApiErrorMessage(error, fallback))
}

export default api
