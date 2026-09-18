import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { checkDatabase } from './db/pool.js'
import { authResolver } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/error.js'
import { checkinsRouter } from './modules/checkins/checkins.routes.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  // Exact dev origin only — never widen to '*' for API traffic.
  app.use(cors({ origin: env.CLIENT_ORIGIN }))
  app.use(express.json({ limit: '100kb' }))
  app.use(authResolver)

  app.get('/api/health', async (_req, res) => {
    res.json({ status: 'ok', db: await checkDatabase() })
  })

  app.use('/api/check-ins', checkinsRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
