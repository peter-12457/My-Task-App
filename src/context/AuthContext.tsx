import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthSession } from '../types/auth'
import { ApiError } from '../services/api'
import { getSession, login, logout } from '../services/authService'

interface AuthContextValue {
  session: AuthSession | null
  isLoading: boolean
  error: string
  login: (email: string, password: string) => Promise<AuthSession | null>
  logout: () => Promise<void>
  refreshSession: () => Promise<AuthSession | null>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await getSession()
      setSession(nextSession)
      setError('')
      return nextSession
    } catch (requestError) {
      setSession(null)
      if (requestError instanceof ApiError && requestError.status === 401) {
        setError('Your session has expired. Please sign in again.')
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to restore your session.')
      }
      return null
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    getSession(controller.signal)
      .then((nextSession) => {
        setSession(nextSession)
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return
        }
        setSession(null)
        setError(requestError instanceof Error ? requestError.message : 'Unable to restore your session.')
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError('')
    try {
      const nextSession = await login(email, password)
      setSession(nextSession)
      if (!nextSession?.user) {
        setError('Login did not create an authenticated session.')
      }
      return nextSession
    } catch (requestError) {
      setSession(null)
      setError(requestError instanceof Error ? requestError.message : 'Login failed.')
      throw requestError
    }
  }, [])

  const signOut = useCallback(async () => {
    setError('')
    try {
      await logout()
      setSession(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Logout failed.')
      throw requestError
    }
  }, [])

  const value = useMemo(() => ({
    session,
    isLoading,
    error,
    login: signIn,
    logout: signOut,
    refreshSession,
    clearError: () => setError(''),
  }), [session, isLoading, error, signIn, signOut, refreshSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
