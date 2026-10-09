// API token plumbing. The Clerk session token is short-lived, so request.js
// asks for a FRESH token on every call through the registered getter instead
// of caching one. Local dev without Clerk registers nothing: no header is
// sent and the server dev bypass resolves the user.
let tokenGetter = null

export function setTokenGetter(fn) {
  tokenGetter = fn
}

export function clearTokenGetter() {
  tokenGetter = null
}

export async function getApiToken() {
  try {
    return (await tokenGetter?.()) ?? null
  } catch {
    return null
  }
}
