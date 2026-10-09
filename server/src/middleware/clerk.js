// Production auth resolution via Clerk. Runs AFTER the dev-bypass
// authResolver: if the bypass already set req.user (local dev), this is a
// no-op. Otherwise it reads the Clerk session (cookie or Authorization
// header) and maps the Clerk subject to the internal UUID user id.
// getAuth is injectable so boundary tests never need real Clerk keys.
import { getAuth } from '@clerk/express'
import { resolveUserId } from '../modules/users/users.service.js'

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
      req.user = { id: await resolveUserId(auth.userId), clerkSub: auth.userId }
    } catch {
      return next()
    }
    next()
  }
}
