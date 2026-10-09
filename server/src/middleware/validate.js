import { z } from 'zod'

// Generic Zod boundary guard: validates req[source], replaces it with the
// parsed (defaulted/coerced) value, and returns the single error contract
// on failure. Use on every write route and on query/param schemas.
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    if (!(schema instanceof z.ZodType)) {
      return next(new Error('validate() requires a Zod schema'))
    }
    const result = schema.safeParse(req[source] ?? {})
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request could not be validated.',
          details: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      })
    }
    req[source] = result.data
    next()
  }
}
