import { z } from "zod";
import { sendApiError, sourceFile } from "./apiError.js";

const validateFile = sourceFile(import.meta.url);

// Generic Zod boundary guard: validates req[source], replaces it with the
// parsed (defaulted/coerced) value, and returns the single error contract
// on failure. Use on every write route and on query/param schemas.
export function validate(schema, source = "body") {
  return (req, res, next) => {
    if (!(schema instanceof z.ZodType)) {
      return next(new Error("validate() requires a Zod schema"));
    }
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      return sendApiError(req, res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "The request contains invalid data.",
        details: result.error.issues.map((issue) => ({
          field: issue.path.length ? issue.path.join(".") : "_root",
          issue: issue.code.replace(/[^a-z0-9]+/gi, "_").toUpperCase(),
          message: issue.message,
        })),
        triggerFile: validateFile,
        cause: {
          name: "ZodError",
          code: "VALIDATION_ERROR",
          message: "Request data failed schema validation.",
        },
      });
    }
    req[source] = result.data;
    next();
  };
}
