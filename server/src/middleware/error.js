import { env } from "../config/env.js";
import { sendApiError, sourceFile } from "./apiError.js";

const errorFile = sourceFile(import.meta.url);

export function notFound(req, res) {
  sendApiError(req, res, {
    status: 404,
    code: "NOT_FOUND",
    message: "The requested resource was not found.",
    triggerFile: errorFile,
    cause: { name: "NotFoundError", code: "NOT_FOUND", message: "No route matched the request." },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = Number(err?.status ?? 500);
  const isProduction = env.NODE_ENV === "production";
  const isServerError = status >= 500;
  const code = isServerError && isProduction ? "INTERNAL_ERROR" : (err?.code ?? "INTERNAL_ERROR");
  const message = isServerError && isProduction ? "Something went wrong." : (err?.message ?? "Request failed.");

  // Keep server logs free of request bodies and sensitive exception details.
  console.error(`[error] ${req.method} ${req.path} -> ${status} (${err?.code ?? code})`);
  sendApiError(req, res, {
    status,
    code,
    message,
    details: err?.details,
    cause: err,
    triggerFile: errorFile,
  });
}
