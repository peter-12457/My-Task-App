import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../services/api'
import { register } from '../services/authService'
import { useAuth } from '../context/AuthContext'

type AuthView = 'login' | 'register'

export function AuthForms() {
  const [view, setView] = useState<AuthView>('login')
  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">{view === 'login' ? 'Sign in to TaskFlow' : 'Create a TaskFlow account'}</h1>
        {view === 'login'
          ? <LoginForm onSwitch={() => setView('register')} />
          : <RegistrationForm onSwitch={() => setView('login')} />}
      </section>
    </main>
  )
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setMessage('')
    auth.clearError()
    try {
      await auth.login(email, password)
      setPassword('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {(message || auth.error) && (
        <p className="form-message error" role="alert">{message || auth.error}</p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Sign in'}
      </button>
      <button type="button" className="link-button" onClick={onSwitch}>
        Create an account
      </button>
    </form>
  )
}

function RegistrationForm({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setMessage('')
    setSuccess(false)
    try {
      await register({ name, email, password, confirmPassword })
      setPassword('')
      setConfirmPassword('')
      setSuccess(true)
      setMessage('Account created. You can now sign in.')
    } catch (error) {
      if (error instanceof ApiError && error.details.length > 0) {
        setMessage(error.details.map((detail) => detail.message).join(' '))
      } else {
        setMessage(error instanceof Error ? error.message : 'Registration failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="register-name">Name</label>
      <input id="register-name" name="name" minLength={2} maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} />

      <label htmlFor="register-email">Email</label>
      <input id="register-email" name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />

      <label htmlFor="register-password">Password</label>
      <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />

      <label htmlFor="register-confirm-password">Confirm password</label>
      <input id="register-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />

      {message && (
        <p className={`form-message ${success ? 'success' : 'error'}`} role={success ? 'status' : 'alert'}>
          {message}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating account...' : 'Create account'}
      </button>
      <button type="button" className="link-button" onClick={onSwitch}>
        Back to sign in
      </button>
    </form>
  )
}
