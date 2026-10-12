// Production auth resolution via Clerk. Runs AFTER the dev-bypass
// authResolver: if the bypass already set req.user (local dev), this is a
// no-op. Otherwise it reads the Clerk session (cookie or Authorization
// header) and maps the Clerk subject to the internal UUID user id.
// getAuth is injectable so boundary tests never need real Clerk keys.
import { clerkClient, getAuth } from '@clerk/express'
import { primaryEmailFromClerkUser } from '../modules/users/clerk-user.js'
import { resolveUser, syncUserFromClerk } from '../modules/users/users.service.js'

export function createClerkResolver({
  getAuthFn = getAuth,
  getClerkUserFn = (clerkSub) => clerkClient.users.getUser(clerkSub),
  resolveUserFn = resolveUser,
  syncUserFn = syncUserFromClerk,
} = {}) {
  return async function clerkResolver(req, _res, next) {
    if (req.user?.id) return next()
    let auth
    try {
      auth = getAuthFn(req)
    } catch {
      return next()
    }
    if (!auth?.isAuthenticated || !auth?.userId) return next()
    const claimRole =
      auth.sessionClaims?.metadata?.role ||
      auth.sessionClaims?.role ||
      auth.claims?.metadata?.role
    const defaultRole = claimRole === 'admin' ? 'admin' : 'user'
    let user
    try {
      user = await resolveUserFn(auth.userId, defaultRole)
    } catch {
      return next()
    }

    let email = user.email ?? null
    if (email === null) {
      try {
        const clerkUser = await getClerkUserFn(auth.userId)
        const syncedUser = await syncUserFn(auth.userId, primaryEmailFromClerkUser(clerkUser))
        email = syncedUser.email ?? null
      } catch {
        // Profile lookup is best-effort. A Clerk API or email-sync failure must
        // not reject an otherwise authenticated API request; the webhook can retry.
      }
    }

    req.user = {
      id: user.id,
      clerkSub: auth.userId,
      role: user.role || 'user',
      email,
    }
    next()
  }
}
