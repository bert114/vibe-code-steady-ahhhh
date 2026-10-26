import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

function relativeSource(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replaceAll("\\", "/");
  const sourceIndex = normalized.lastIndexOf("/server/src/");
  if (sourceIndex >= 0) return normalized.slice(sourceIndex + 1);
  const serverIndex = normalized.lastIndexOf("/server/");
  if (serverIndex >= 0) return normalized.slice(serverIndex + 1);
  return normalized.split("/").slice(-4).join("/");
}

export function sourceFile(moduleUrl) {
  return relativeSource(fileURLToPath(moduleUrl));
}

function locationFromStack(error) {
  for (const line of error?.stack?.split("\n").slice(1) ?? []) {
    const match = line.match(/(?:\(| at )(.+?):(\d+):(\d+)\)?$/);
    if (!match) continue;
    const file = relativeSource(match[1]);
    if (!file?.startsWith("server/src/")) continue;
    return { file, line: Number(match[2]), column: Number(match[3]) };
  }
  return null;
}

function inferController(req) {
  if (req.errorContext?.controller) return req.errorContext.controller;
  const path = (req.originalUrl || req.url || req.path || "").split("?")[0];
  if (path === "/api/health") return "health";
  if (path.startsWith("/api/admin/")) return "admin.overview";
  if (path.startsWith("/api/dashboard")) return "dashboard.getSummary";
  if (path.startsWith("/api/check-ins")) {
    if (/\/trends\/?$/.test(path)) return "checkins.getTrends";
    if (path.split("/").filter(Boolean).length >= 3 && req.method === "GET") return "checkins.getCheckinById";
    if (path.split("/").filter(Boolean).length >= 3 && req.method === "DELETE") return "checkins.deleteCheckin";
    if (req.method === "POST") return "checkins.postCheckin";
    return "checkins.getCheckins";
  }
  if (path.startsWith("/api/insights")) {
    if (path.endsWith("/analyze")) return "insights.postAnalyze";
    if (path.endsWith("/signals")) return "insights.getSignals";
    if (path.split("/").filter(Boolean).length >= 3 && path !== "/api/insights/analyze" && path !== "/api/insights/signals") return "insights.getInsightByIdHandler";
    return "insights.getInsights";
  }
  if (path.startsWith("/api/reminders")) return req.method === "PATCH" ? "reminders.patchReminderRead" : "reminders.getReminders";
  if (path.startsWith("/api/users")) {
    if (path.endsWith("/export")) return "users.exportMe";
    if (req.method === "DELETE") return "users.deleteMe";
    if (req.method === "GET") return "users.getMe";
    return "users.webhook";
  }
  return null;
}

function safeDiagnosticMessage(message) {
  return String(message ?? "Request failed.")
    .replace(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s'"`]+/gi, "[redacted connection string]")
    .replace(/\bBearer\s+[^\s'"`]+/gi, "Bearer [redacted]")
    .replace(/\b(password|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]");
}

export function requestContext(req, res, next) {
  req.requestId = `req_${randomUUID()}`;
  res.setHeader?.("X-Request-Id", req.requestId);
  next();
}

export function sendApiError(req, res, {
  status,
  code,
  message,
  details = [],
  cause = null,
  triggerFile = null,
}) {
  const requestId = req.requestId ?? `req_${randomUUID()}`;
  req.requestId = requestId;
  res.setHeader?.("X-Request-Id", requestId);
  const isProduction = env.NODE_ENV === "production";
  const error = { code, message, details: Array.isArray(details) ? details : [] };
  const path = (req.originalUrl || req.url || req.path || "/").split("?")[0];

  if (!isProduction) {
    const location = locationFromStack(cause) ?? null;
    const diagnosticCause = cause instanceof Error
      ? {
          name: cause.name || "Error",
          ...(cause.code ? { code: String(cause.code) } : {}),
          message: safeDiagnosticMessage(cause.message),
        }
      : cause && typeof cause === "object"
        ? {
            ...(cause.name ? { name: String(cause.name) } : {}),
            ...(cause.code ? { code: String(cause.code) } : {}),
            ...(cause.message ? { message: safeDiagnosticMessage(cause.message) } : {}),
          }
        : null;
    error.debug = {
      requester_id: req.user?.id ?? null,
      trigger: {
        controller: inferController(req),
        file: location?.file ?? triggerFile,
        ...(location ? { line: location.line, column: location.column } : {}),
      },
      cause: diagnosticCause,
    };
    error.message = safeDiagnosticMessage(message);
  }

  res.status(status).json({
    success: false,
    error: {
      ...error,
      timestamp: new Date().toISOString(),
      path,
      request_id: requestId,
    },
  });
}
