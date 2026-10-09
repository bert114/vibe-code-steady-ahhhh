// Production auth resolution via Clerk. Runs AFTER the dev-bypass
// authResolver: if the bypass already set req.user (local dev), this is a
// no-op. Otherwise it reads the Clerk session (cookie or Authorization
// header) and maps the Clerk subject to the internal UUID user id.
// getAuth is injectable so boundary tests never need real Clerk keys.
import { getAuth } from '@clerk/express'
import { resolveUser } from '../modules/users/users.service.js'

export function createClerkResolver({ getAuthFn = getAuth } = {}) {
  return async function clerkResolver(req, _res, next) {
    if (req.user?.id) return next()
    let auth
    try {
      auth = getAuthFn(req)
    } catch {
      return next()
    }
    if (!auth?.isAuthenticated || !auth?.userId) return next()
    try {
      const claimRole =
        auth.sessionClaims?.metadata?.role ||
        auth.sessionClaims?.role ||
        auth.claims?.metadata?.role
      const defaultRole = claimRole === 'admin' ? 'admin' : 'user'
      const user = await resolveUser(auth.userId, defaultRole)
      req.user = {
        id: user.id,
        clerkSub: auth.userId,
        role: user.role || 'user',
      }
    } catch {
      return next()
    }
    next()
  }
}
