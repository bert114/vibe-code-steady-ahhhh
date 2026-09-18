import { env } from '../config/env.js'

// Development-only auth resolver. In production (or when the bypass is off)
// this sets no user — protected routes must then use real authentication,
// which lands before the external beta.
export function authResolver(req, _res, next) {
  if (env.DEV_AUTH_BYPASS && env.NODE_ENV !== 'production') {
    // Server-side env value only. Never accept a user id from the client.
    req.user = { id: env.DEV_USER_ID }
  }
  next()
}

// Use on any route that needs an authenticated user.
export function requireUser(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.', details: [] },
    })
  }
  next()
}
