# agent-clean.md — Consistency Instructions for Clean Rewrite

> This file is the single source of truth for how to write code in this project.
> Follow these rules on every new or rewritten file. No exceptions.
> Reference implementation for entry point: `backend/server.js`.

## 1. Stack Lock

- Runtime: Node.js ESM only (`"type": "module"`). No CommonJS.
- Web: `express`, `cors`.
- Validation: `joi` only. No `zod`. No manual `if (!field)` checks. No hand-rolled validators.
- Database: Neon Serverless Postgres via `@neondatabase/serverless` only. No `mongoose`. No `drizzle`. No ORM.
- Uploads: `multer` (memory storage). Images via `cloudinary`.
- Auth IDs: Clerk `userId` stored as `TEXT`. No separate auth table.
- Deps to install: `express cors dotenv joi @neondatabase/serverless cloudinary multer @clerk/express @google/generative-ai`. Dev: `nodemon`.

## 2. Project Shape

```
backend/
  server.js              # entry, wiring only
  env.js                 # Joi-validated env, single dotenv load
  healthcheck.js         # startup checks, never throws silently
  src/
    config/db.js         # exports query() + connectDB() only
    routes/*.js          # wiring only: middleware chain -> controller
    middlewares/validate.js  # generic Joi middleware
    validators/*.joi.js  # Joi schemas, one per domain
    controllers/*.js     # thin: req -> service -> response
    services/*.js        # business logic + query() calls only
    utils/*.js           # pure helpers, no req/res, no query
    constants/errorMessages.js
    middlewares/erros.js # central error handler (keep filename as-is or rename to errors.js on rewrite)
    middlewares/notFound.js
```

RULE: `routes` never contain business logic. `controllers` never contain SQL. `services` never touch `req`/`res`. `utils` never touch DB or network.

## 3. Module + Naming Rules

- ESM named exports. Avoid default exports except routers where existing convention requires it.
- Files: `camelCase.js`, schemas: `<domain>.joi.js` (e.g. `image.joi.js`).
- Tables: snake_case plural (`generation_logs`). Columns: snake_case (`user_id`, `last_reset`, `created_at`).
- JS vars: `camelCase` (`userId`). SQL params: `$1, $2`.
- Timestamps: `TIMESTAMPTZ DEFAULT now()` as `created_at` / `updated_at`.
- IDs: `UUID DEFAULT gen_random_uuid()` for owned rows, `TEXT` PK when the ID comes from Clerk/external.
- JSON payloads: `JSONB` column + `::jsonb` cast on write.

## 4. Env (`env.js`) — Joi Only

RULE: Single `dotenv` load lives here. No `dotenv.config()` anywhere else. Fail fast on invalid env.

```js
import "dotenv/config";
import Joi from "joi";

const schema = Joi.object({
  PORT: Joi.number().integer().positive().default(5000),
  DATABASE_URL: Joi.string().uri().required(), // Neon pooled URL
  INFIP_API_KEY: Joi.string().min(1).required(),
  INFIP_BASE_URL: Joi.string().uri().required(),
  GEMINI_API_KEY: Joi.string().min(1).required(),
  OLLAMA_URL: Joi.string().uri().required(),
  OLLAMA_MODEL: Joi.string().min(1).required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().min(1).required(),
  CLOUDINARY_API_KEY: Joi.string().min(1).required(),
  CLOUDINARY_API_SECRET: Joi.string().min(1).required(),
  CLERK_SECRET_KEY: Joi.string().min(1).required(),
}).unknown(true);

const { value: env, error } = schema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  console.error(
    "Invalid environment variables:",
    error.details.map((d) => d.message),
  );
  process.exit(1);
}

export default env;
```

RULE: Import `env` from this file. Never read `process.env` directly in other files.

## 5. Database (`src/config/db.js`) — Manual `query(sql, values)`

RULE: All DB access goes through `query(text, values)`. Never interpolate values into SQL strings. Always use `$n` placeholders.

```js
import { neon } from "@neondatabase/serverless";
import env from "../../env.js";

const sql = neon(env.DATABASE_URL);

export const query = (text, values = []) => sql.query(text, values);
// returns { rows, rowCount }

export const connectDB = async () => {
  await sql`SELECT 1`;
  console.log("Neon connected");
};
```

RULES:

- `query` is the only DB entrypoint. Services call `query`, nothing else opens connections.
- Prefer one atomic statement over read-modify-save. Example pattern (not tied to any file):
  `INSERT ... ON CONFLICT (key) DO UPDATE SET ... RETURNING *`
- Destructure results consistently: `const { rows } = await query(text, values);`
- DDL lives in `sql/schema.sql`, applied once via Neon dashboard or `psql`. Example shape:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  remaining INT NOT NULL DEFAULT 10,
  last_reset TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 6. How To Code `server.js` (Reference)

RULE: `server.js` does wiring only. Follow this exact order. Do not add business logic here.

```
1. imports (express, cors, env, connectDB, healthcheck, routers, error middlewares)
2. const app = express()
3. await connectDB() then await checkExternalServices() — crash on failure, never start degraded
4. app.set("trust proxy", 1)
5. app.use(cors({ origin: allowedOrigins, methods, allowedHeaders, credentials: true })) — ONCE, no manual res.header CORS afterwards
6. app.use(express.json({ limit: "1mb" }))
7. app.get("/", health) + app.get("/health", db ping)
8. mount routers: app.use("/api/<domain>", router)
9. app.use(notFound) returning 404
10. app.use(errorMiddleware) last
11. app.listen(env.PORT) with graceful shutdown (SIGINT/SIGTERM close server)
```

RULES:

- `allowedOrigins` comes from env / constant array. No hardcoded origin in a second middleware.
- `express.json` always has a `limit`.
- 404 handler before error handler. 404 returns `404`, never `400`.
- No dead imports. Every import in `server.js` must be used.
- `PORT` read once from `env`.

Minimal skeleton:

```js
import express from "express";
import cors from "cors";
import env from "./env.js";
import { connectDB } from "./src/config/db.js";
import { checkExternalServices } from "./healthcheck.js";
import errorMiddleware from "./src/middlewares/erros.js";
import notFound from "./src/middlewares/notFound.js";

const app = express();
await connectDB();
await checkExternalServices();

app.set("trust proxy", 1);
app.use(cors({ origin: env.ALLOWED_ORIGINS ?? true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) =>
  res.json({ success: true, message: "Backend is running" }),
);

// app.use("/api/<domain>", router);

app.use(notFound);
app.use(errorMiddleware);

const server = app.listen(env.PORT, () =>
  console.log(`Server running on port ${env.PORT}`),
);
process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
```

## 7. Validation — Joi Route Middleware

RULE: Every mutating route and every route with params validates input via `validate(schema, property)`. No inline checks in controllers.

New file `src/middlewares/validate.js`:

```js
export const validate =
  (schema, property = "body") =>
  async (req, _res, next) => {
    try {
      req[property] = await schema.validateAsync(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (err) {
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      next(err);
    }
  };
```

Schema file shape `src/validators/<domain>.joi.js`:

```js
import Joi from "joi";
export const createSchema = Joi.object({
  userId: Joi.string().min(1).required(),
  prompt: Joi.string().min(1).max(2000).required(),
  n: Joi.number().integer().min(1).max(4).default(1),
});
```

Wiring pattern (example only):

```js
router.post("/<action>", validate(createSchema), controller);
router.get("/<resource>/:id", validate(idSchema, "params"), controller);
router.post(
  "/<upload>",
  upload.single("image"),
  validateFile,
  validate(createSchema),
  controller,
);
```

RULES:

- `abortEarly: false`, `stripUnknown: true` always.
- Headers (e.g. `idempotency-key`) validated with `Joi.object({...}).unknown(true)` on `req.headers` via `validate(schema, "headers")` — never manual `if (!req.headers[...])`.
- File presence/type/size checked in a dedicated `validateFile` middleware (mime allowlist + size limit), not in Joi body schema, not in controller.
- Validation errors flow to central error handler with `code: VALIDATION_ERROR` + `details`.

## 8. Controllers — Thin

RULE: Controller = parse (already validated) → call service → `successResponse`. No SQL, no Joi, no `if (!prompt)`.

```js
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { successResponse } from "../helper/responseHelper.js";

export const create = asyncHandler(async (req, res) => {
  const result = await service.create(req.body);
  return successResponse(res, 201, result);
});
```

RULES: Wrap with `asyncHandler(fn)` (catches async errors to `next`). Never `try/catch + res.status(500)` per controller. Never `console.log(req.body)`.

## 9. Services — Business Logic + `query` Only

RULE: Service takes plain data, runs `query(sql, values)`, returns plain data. Never touches `req`/`res`.

```js
import { query } from "../config/db.js";

export const findById = async (id) => {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
};
```

RULES: Parameter order in `values[]` matches `$n` order. Return `rows[0]` for single-row reads. Throw via `throwError(code, status)` on domain failures (e.g. insufficient credits), never `res.status`.

## 10. Response + Error Shape (Single Contract)

```js
// success
{ "success": true, "data": {...} }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

RULES:

- `successResponse(res, status, data)` only in controllers.
- Domain errors: `throwError("CODE", statusCode, details)` → central `errorMiddleware` maps `code` via `constants/errorMessages.js`.
- No inline `res.status(400).json({ error })` anywhere except the two central middlewares.
- Fix on rewrite: old `errorResponse` referencing undefined vars is forbidden.
- No `console.log` of bodies/errors in request path. Use `console.error` in startup/healthcheck only.

## 11. Cross-Cutting Patterns

- **Idempotency/rate-limit:** chain as middleware `validate(headerSchema,"headers") → validate(bodySchema) → rateLimit → controller`. Middleware reads `req.body.userId` set by validation, never re-parses.
- **Uploads:** `multer.memoryStorage()` with `limits: { fileSize: 10*1024*1024 }` + `fileFilter` allowlist (`image/jpeg/png/webp`) → `validateFile` → controller streams `req.file.buffer` to Cloudinary/service. Never write to disk.
- **Healthcheck:** `connectDB()` + one ping per external (Ollama/Gemini/Cloudinary/Neon `SELECT 1`). Throw on failure in startup; log once. Never swallow and start degraded.
- **Seed script:** `DELETE FROM <table>; INSERT INTO <table>(...) VALUES ($1,...)` in a loop with params. Exit `0` on success, `1` on error.

## 12. Forbidden (Will Fail Review)

- `zod`, `mongoose`, ORM query builders, string-interpolated SQL.
- `process.env` outside `env.js`. Duplicate `dotenv.config()`.
- Manual CORS headers after `cors()`. Second `Access-Control-Allow-Origin` middleware.
- `console.log` in request path. Commented-out dead code. Unused imports.
- Inline validation in controllers/services. Controller SQL. Service `res.json`.
- 404 returning `400`. Error handler registered before 404. Filenames with trailing spaces.

## 13. Verify Checklist (Every Change)

1. `npm run dev` boots, `GET /` → `{success:true}`.
2. Valid payload → `2xx` with `{success:true,data}`.
3. Invalid body / missing header / bad file → `400` with `{success:false,error:{code,details}}`.
4. Unknown route → `404` `ROUTE_NOT_FOUND`.
5. Neon dashboard shows expected rows. `SELECT 1` passes in healthcheck.
