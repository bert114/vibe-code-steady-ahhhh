// Single error contract: { error: { code, message, details } }.
// Never send stack traces to users. Never log sensitive payloads —
// only status codes, safe codes, and timing.
export function notFound(_req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.', details: [] },
  })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = Number(err?.status ?? 500)
  const code = err?.code ?? 'INTERNAL_ERROR'
  // Safe metadata only: no bodies, notes, prompts, tokens, or connection strings.
  console.error(`[error] ${req.method} ${req.path} -> ${status} (${code})`)
  res.status(status).json({
    error: {
      code,
      message: status >= 500 ? 'Something went wrong.' : (err.message ?? 'Request failed.'),
      details: [],
    },
  })
}
