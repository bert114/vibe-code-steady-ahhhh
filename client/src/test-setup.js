import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Unit tests assume the no-keys dev-bypass mode ("no Clerk keys in tests").
// A developer's local client/.env may carry VITE_CLERK_PUBLISHABLE_KEY,
// which would flip clerkEnabled on and leave real Clerk components hanging
// unloaded in jsdom. Strip it (and let individual files opt back in via
// vi.stubEnv + dynamic import) so the suite is deterministic everywhere.
delete process.env.VITE_CLERK_PUBLISHABLE_KEY
if (typeof globalThis !== 'undefined' && globalThis.__vite_ssr_import_meta__?.env) {
  delete globalThis.__vite_ssr_import_meta__.env.VITE_CLERK_PUBLISHABLE_KEY
}
