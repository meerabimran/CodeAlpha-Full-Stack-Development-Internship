import { useContext } from 'react'
import WorkspaceDataContext from './workspaceDataContext.js'

export default function useWorkspaceData() {
  const context = useContext(WorkspaceDataContext)
  if (!context) throw new Error('useWorkspaceData must be used within WorkspaceDataProvider.')
  return context
}
