// Entry point. Imports env.js first so startup guards run before anything listens.
import './config/env.js'
import { env } from './config/env.js'
import { createApp } from './app.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`[server] Steady-Ahh API listening on :${env.PORT} (${env.NODE_ENV})`)
})
