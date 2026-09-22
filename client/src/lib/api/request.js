// Shared request helper — the ONLY place that knows the API base URL,
// JSON headers, and error parsing. Feature modules call this via their
// public api.js and never duplicate request configuration.
// Every API failure also surfaces as an error toast (success toasts stay
// explicit: feature stores push them with contextual copy after mutations).
import { useToastStore } from '../../components/ui/toastStore.js'
import { getApiToken } from './authToken.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

export class ApiError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

function toastError(code, message, details) {
  try {
    useToastStore.getState().error(message, details)
  } catch {
    // Toasting must never break the request contract (e.g. in tests where
    // the store module can't initialize). Callers still receive the throw.
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  const token = await getApiToken()
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    const err = new ApiError('NETWORK_ERROR', 'Could not reach the server.', [])
    toastError(err.code, err.message, err.details)
    throw err
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = data?.error ?? {}
    const apiError = new ApiError(
      err.code ?? 'UNKNOWN_ERROR',
      err.message ?? 'Something went wrong.',
      err.details ?? [],
    )
    toastError(apiError.code, apiError.message, apiError.details)
    throw apiError
  }

  return data
}
