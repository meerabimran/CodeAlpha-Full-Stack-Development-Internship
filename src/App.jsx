import { BrowserRouter, Route, Routes } from 'react-router-dom'
import WorkspaceLayout from './components/WorkspaceLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import useAuth from './context/useAuth.js'
import { WorkspaceDataProvider } from './context/WorkspaceDataContext.jsx'
import useWorkspaceData from './context/useWorkspaceData.js'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import Tasks from './pages/Tasks.jsx'
import Board from './pages/Board.jsx'
import Calendar from './pages/Calendar.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Profile from './pages/Profile.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import NotFound from './pages/NotFound.jsx'
import './App.css'

function Workspace() {
  return (
    <WorkspaceDataProvider>
      <WorkspaceContent />
    </WorkspaceDataProvider>
  )
}

function WorkspaceContent() {
  const { projects, tasks, loading, error, refresh, createProject, updateProject, deleteProject, createTask, updateTask, deleteTask } = useWorkspaceData()
  const { user } = useAuth()
  return (
    <WorkspaceLayout taskCount={tasks.length} user={user} projects={projects}>
      {error && <div className="page-alert error-alert" role="alert"><span>{error}</span><button className="button button-quiet" onClick={refresh}>Retry</button></div>}
      <Routes>
        <Route path="/" element={<Dashboard projects={projects} tasks={tasks} user={user} loading={loading} onAddTask={createTask} onUpdateStatus={(taskId, status) => updateTask(taskId, { status })} onUpdateTask={updateTask} onDeleteTask={deleteTask} />} />
        <Route path="/projects" element={<Projects projects={projects} loading={loading} onAddProject={createProject} />} />
        <Route path="/projects/:id" element={<ProjectDetails projects={projects} tasks={tasks} loading={loading} user={user} onAddTask={createTask} onUpdateProject={updateProject} onDeleteProject={deleteProject} onUpdateTask={updateTask} onDeleteTask={deleteTask} />} />
        <Route path="/tasks" element={<Tasks tasks={tasks} projects={projects} user={user} loading={loading} onAddTask={createTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />} />
        <Route path="/board" element={<Board tasks={tasks} projects={projects} user={user} loading={loading} onAddTask={createTask} onUpdateStatus={(taskId, status) => updateTask(taskId, { status })} onUpdateTask={updateTask} onDeleteTask={deleteTask} />} />
        <Route path="/calendar" element={<Calendar tasks={tasks} loading={loading} />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </WorkspaceLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/*" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
