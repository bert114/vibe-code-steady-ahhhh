import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { env } from '../config/env.js'
import { audit } from './audit.js'

function auditedApp(handler) {
  const app = express()
  app.use(express.json())
  app.use(audit)
  app.post('/probe', (req, res) => {
    req.audit.produced = { checkins: 1 }
    handler?.(req)
    res.json({ checkins: [{ id: 'abc', note: 'SECRET-NOTE-MUST-NOT-LEAK' }] })
  })
  return app
}

describe('audit middleware (safe metadata only)', () => {
  it('logs one JSON line per request without raw note content', async () => {
    const prev = env.AUDIT_ENABLED
    env.AUDIT_ENABLED = true
    const lines = []
    const origLog = console.log
    console.log = (msg) => {
      lines.push(String(msg))
    }
    try {
      const res = await request(auditedApp())
        .post('/probe?windowDays=7')
        .send({ mood_score: 2, note: 'SECRET-NOTE-MUST-NOT-LEAK', emotions: ['tired'] })
      expect(res.status).toBe(200)
    } finally {
      console.log = origLog
      env.AUDIT_ENABLED = prev
    }
    const auditLines = lines.filter((l) => l.startsWith('[audit]'))
    expect(auditLines.length).toBeGreaterThan(0)
    const entry = JSON.parse(auditLines[0].replace('[audit] ', ''))
    expect(entry.audit).toBe(true)
    expect(entry.method).toBe('POST')
    expect(entry.path).toBe('/probe')
    expect(entry.status).toBe(200)
    expect(typeof entry.durationMs).toBe('number')
    // Safe: field names + lengths/counts, never values.
    expect(entry.body.fields).toContain('note')
    expect(entry.body.noteChars).toBeGreaterThan(0)
    const raw = JSON.stringify(entry)
    expect(raw).not.toContain('SECRET-NOTE-MUST-NOT-LEAK')
  })
})
