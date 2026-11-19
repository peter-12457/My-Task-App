export interface ApiErrorDetail {
  path?: string
  message: string
}

export interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
    details?: ApiErrorDetail[]
  }
  message?: string
}

export class ApiError extends Error {
  status: number
  code?: string
  details: ApiErrorDetail[]

  constructor(status: number, message: string, code?: string, details: ApiErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export function apiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(apiUrl(path), {
      credentials: 'include',
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(0, 'Unable to reach TaskFlow. Check your network connection.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') || ''
  const data: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const body = (data && typeof data === 'object' ? data : {}) as ApiErrorBody
    const error = body.error
    const detailMessage = error?.details?.map((detail) =>
      detail.path ? `${detail.path}: ${detail.message}` : detail.message,
    ).join(' ')
    const message = detailMessage || error?.message || body.message ||
      getStatusMessage(response.status)

    throw new ApiError(response.status, message, error?.code, error?.details)
  }

  return data as T
}

function getStatusMessage(status: number) {
  switch (status) {
    case 400:
      return 'The request contains invalid data.'
    case 401:
      return 'Please sign in to continue.'
    case 403:
      return 'The request was rejected by the backend origin policy.'
    case 404:
      return 'The requested resource was not found.'
    case 422:
      return 'The submitted task data is invalid.'
    case 409:
      return 'An account with this email already exists.'
    case 429:
      return 'Too many requests. Please wait and try again.'
    case 500:
      return 'TaskFlow encountered a server error.'
    default:
      return 'TaskFlow returned an unexpected error.'
  }
}
