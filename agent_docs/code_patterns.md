# Code Patterns

Use this only for project-specific conventions. If a section is unknown, inspect the existing code before filling it in.

## Architecture

- Primary pattern: hybrid — feature-based client + layered (routes → controller → service → repository → SQL) server.
- Keep domain logic separate from UI/transport code.
- Reuse existing modules before creating new abstractions.
- Cross-domain server capabilities (AI, pattern analysis) live in `server/src/services/`, not inside a module.

## Data And State

- Data fetching: `client/src/lib/api/` shared request helper (base URL, JSON headers, error parsing); feature modules call it through their public `api.js`. A client feature must not import another feature's private files.
- Server state: fetch per need via feature `api.js`; do not mirror server state into a giant global store.
- Client state: Zustand, small feature-scoped stores (check-in draft, insight/reminder UI state, dev user context, dashboard data).
- Forms: client-side validation for UX; Zod on the server for every write request.

## Errors And Validation

- Validate external inputs at boundaries (Zod for request bodies, params, query strings, and AI output).
- Return the user-safe contract `{ error: { code, message, details } }` from the edge.
- Log developer context server-side: IDs, status codes, timing, safe error codes — never raw notes, prompts, or full AI output.
- Do not swallow errors silently.

## Naming

- Files: server modules `<name>.<layer>.js` (`checkins.routes.js`, `checkins.controller.js`, `checkins.service.js`, `checkins.repository.js`, `checkins.validation.js`).
- Components/classes: PascalCase
- Functions/variables: camelCase
- Env vars/constants: UPPER_SNAKE_CASE; client env vars are `VITE_`-prefixed, server secrets (`DATABASE_URL`, AI token) live only on the server.

## AI Tool Patterns

Fill this in only if AI tools/actions exist.

- AI is a read-only analysis service — no product tools, no external actions, no MCP surface in the MVP.
- Gate every AI call on deterministic pattern evidence; never send raw user notes beyond what the analysis window needs.
- Validate structured AI output with the server's Zod schema; reject malformed output with the neutral fallback.
- Require approval for destructive, external-network, credential-bearing, and production actions — none exist on the AI path in MVP.
- Log trace IDs and redact secrets/customer data.