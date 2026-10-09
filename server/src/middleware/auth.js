import { env } from "../config/env.js";

// Development-only auth resolver. In production (or when the bypass is off)
// this sets no user — protected routes must then use real authentication,
// which lands before the external beta.
export function authResolver(req, _res, next) {
  if (!req.user?.id && env.DEV_AUTH_BYPASS && env.NODE_ENV !== "production") {
    // Server-side env value only. Never accept a user id from the client.
    req.user = {
      id: env.DEV_USER_ID,
      role: process.env.DEV_USER_ROLE || "user",
    };
  }
  next();
}

// Use on any route that needs an authenticated user.
// TEMP-OPEN-ACCESS: when env.OPEN_ACCESS is true (dev default), every
// request is allowed without a session and attributed to DEV_USER_ID so
// existing `req.user.id` scoping keeps working. Set OPEN_ACCESS=false to
// restore strict 401 enforcement. Revert before beta (production guard in
// config/env.js refuses to boot open). TODO(REVERT): delete the open branch.
export function requireUser(req, res, next) {
  if (env.OPEN_ACCESS) {
    if (!req.user?.id) {
      // Server-side value only — never accept a user id from the client.
      // Falls back to a fixed UUID when DEV_USER_ID is unset so local dev
      // without server/.env still flows (FK needs a UUID-shaped id).
      req.user = {
        id: env.DEV_USER_ID || '00000000-0000-4000-8000-000000000000',
        role: process.env.DEV_USER_ROLE || 'user',
        openAccess: true,
      };
    }
    return next();
  }
  if (!req.user?.id) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
        details: [],
      },
    });
  }
  next();
}

// Enforces Role-Based Access Control (RBAC).
// Expects an authenticated req.user with a role field.
export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user?.id) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
          details: [],
        },
      });
    }

    const currentRole = req.user.role || "user";
    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource.",
          details: [],
        },
      });
    }

    next();
  };
}
