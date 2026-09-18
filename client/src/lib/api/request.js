// Shared request helper — the ONLY place that knows the API base URL,
// JSON headers, and error parsing. Feature modules call this via their
// public api.js and never duplicate request configuration.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

export class ApiError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server.', [])
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = data?.error ?? {}
    throw new ApiError(
      err.code ?? 'UNKNOWN_ERROR',
      err.message ?? 'Something went wrong.',
      err.details ?? [],
    )
  }

  return data
}
