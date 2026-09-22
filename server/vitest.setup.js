// Test env never uses the dev auth bypass: boundary tests assert 401s, and
// db-backed suites inject req.user explicitly. Pre-setting the var (before
// any test file imports config/env.js) wins over server/.env because dotenv
// never overrides an already-set variable.
process.env.DEV_AUTH_BYPASS = 'false'
