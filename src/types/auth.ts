export interface AuthUser {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface AuthSession {
  user?: AuthUser
  expires?: string
}

export interface RegistrationInput {
  name: string
  email: string
  password: string
  confirmPassword: string
}
