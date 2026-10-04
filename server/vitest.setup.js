// Test env never uses the dev auth bypass: boundary tests assert 401s, and
// db-backed suites inject req.user explicitly. Pre-setting the var (before
// any test file imports config/env.js) wins over server/.env because dotenv
// never overrides an already-set variable.
// TEMP-OPEN-ACCESS: tests pin closed mode so the 401 boundary contract stays
// verified; dev default remains open (OPEN_ACCESS unset => true). Open-mode
// behavior is covered by app.test.js toggling env.OPEN_ACCESS at runtime.
process.env.DEV_AUTH_BYPASS = 'false'
process.env.OPEN_ACCESS = 'false'
process.env.AUDIT_ENABLED = 'false'
