// Production Clerk resolution and local-user provisioning. A verified Clerk
// subject is the canonical users.clerk_id primary key and is provisioned before a
// protected controller runs. The development bypass is only a fallback for
// requests with no verified Clerk session.
import { getAuth } from '@clerk/express'
import { resolveUser } from '../modules/users/users.service.js'

export function createRequireSyncedUser({
  getAuthFn = getAuth,
  resolveUserFn = resolveUser,
} = {}) {
  return async function requireSyncedUser(req, _res, next) {
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
      const user = await resolveUserFn(auth.userId, defaultRole)
      req.user = {
        id: user.id,
        clerkSub: auth.userId,
        role: user.role || 'user',
      }
    } catch (err) {
      // Do not continue to a controller without its local Clerk-keyed user.
      return next(err)
    }
    next()
  }
}

// Keep the previous export for consumers outside the app while the middleware
// name changes to describe its guarantee.
export const createClerkResolver = createRequireSyncedUser
