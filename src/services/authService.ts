import { apiRequest, apiUrl } from './api'
import type { AuthSession, RegistrationInput } from '../types/auth'

interface CsrfResponse {
  csrfToken: string
}

export async function getProviders() {
  return apiRequest<Record<string, unknown>>('/auth/providers')
}

export async function register(input: RegistrationInput) {
  return apiRequest<{ message?: string }>('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function getSession(signal?: AbortSignal) {
  return apiRequest<AuthSession | null>('/auth/session', { signal })
}

export async function login(email: string, password: string) {
  const csrf = await apiRequest<CsrfResponse>('/auth/csrf')
  const callbackUrl = 'https://task-flow-six-rouge.vercel.app'
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    callbackUrl,
    email,
    password,
  })

  await apiRequest<unknown>('/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    body,
  })

  return getSession()
}

export async function logout() {
  const csrf = await apiRequest<CsrfResponse>('/auth/csrf')
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    callbackUrl: 'https://task-flow-six-rouge.vercel.app',
  })

  await apiRequest<unknown>('/auth/signout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    body,
  })
}

export function authApiUrl(path: string) {
  return apiUrl(path)
}
