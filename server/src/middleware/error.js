// Single error contract: { error: { code, message, details } }.
// NODE_ENV-aware: production masks 5xx details (generic user error);
// non-production returns the specific error for developers.
// Never send stack traces, raw notes, prompts, tokens, or connection
// strings to clients — only status codes, safe codes, and timing.
import { env } from "../config/env.js";

export function notFound(_req, res) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
      details: [],
    },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = Number(err?.status ?? 500);
  const isProd = env.NODE_ENV === "production";
  const isServerError = status >= 500;
  // Production masks 5xx internals (e.g. raw pg codes like 28P01) behind the
  // safe contract; development exposes the specific code/message instead.
  // 4xx stays specific in both envs (user-actionable).
  const code =
    isServerError && isProd
      ? "INTERNAL_ERROR"
      : (err?.code ?? "INTERNAL_ERROR");
  const message =
    isServerError && isProd
      ? "Something went wrong."
      : (err.message ?? "Request failed.");
  // Safe metadata only: no bodies, notes, prompts, tokens, or connection strings.
  console.error(
    `[error] ${req.method} ${req.path} -> ${status} (${err?.code ?? code})`,
  );
  if (!isProd && isServerError && err?.stack) console.error(err.stack);
  res.status(status).json({
    error: {
      code,
      message,
      details: [],
    },
  });
}
