import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthForms } from './components/AuthForms'
import { TaskDashboard } from './components/TaskDashboard'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

function AuthenticatedApp() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="auth-layout">
        <p role="status">Restoring session...</p>
      </main>
    )
  }

  if (!session?.user) {
    return <AuthForms />
  }

  return <TaskDashboard />
}

export default App
