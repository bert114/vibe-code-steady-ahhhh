import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  invalidateUserCache,
  purgeUserCache,
  readThrough,
  setCacheStore,
} from './cache.service.js'

// Minimal in-memory stand-in for the node-redis hash commands we use.
function memoryStore() {
  const hashes = new Map()
  return {
    hashes,
    async hmGet(key, fields) {
      const h = hashes.get(key) ?? new Map()
      return fields.map((f) => h.get(f) ?? null)
    },
    async hSet(key, field, value) {
      if (!hashes.has(key)) hashes.set(key, new Map())
      hashes.get(key).set(field, value)
      return 1
    },
    async expire() {
      return 1
    },
    async del(key) {
      return hashes.delete(key) ? 1 : 0
    },
  }
}

const USER_A = 'user_a'
const USER_B = 'user_b'

describe('cache.service readThrough', () => {
  let store

  beforeEach(() => {
    store = memoryStore()
    setCacheStore(store)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    setCacheStore(undefined)
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('loads once, then serves the cached payload', async () => {
    const loader = vi.fn().mockResolvedValue({ n: 1 })
    expect(await readThrough(USER_A, 'dashboard:summary', loader)).toEqual({ n: 1 })
    expect(await readThrough(USER_A, 'dashboard:summary', loader)).toEqual({ n: 1 })
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('isolates users: one user never sees another user\'s cache', async () => {
    await readThrough(USER_A, 'dashboard:summary', async () => ({ owner: 'a' }))
    const res = await readThrough(USER_B, 'dashboard:summary', async () => ({ owner: 'b' }))
    expect(res).toEqual({ owner: 'b' })
  })

  it('reloads after invalidation', async () => {
    vi.useFakeTimers({ now: 1_000_000 })
    const loader = vi.fn().mockResolvedValueOnce({ v: 1 }).mockResolvedValueOnce({ v: 2 })
    await readThrough(USER_A, 'trends:30', loader)
    await invalidateUserCache(USER_A)
    expect(await readThrough(USER_A, 'trends:30', loader)).toEqual({ v: 2 })
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('does not re-cache a read that started before a concurrent write', async () => {
    vi.useFakeTimers({ now: 1_000_000 })
    let release
    const slow = readThrough(USER_A, 'insights:overview', () =>
      new Promise((resolve) => { release = () => resolve({ v: 'stale' }) }),
    )
    // Write lands while the slow read is in flight.
    vi.setSystemTime(1_000_050)
    await invalidateUserCache(USER_A)
    release()
    await slow

    const fresh = vi.fn().mockResolvedValue({ v: 'fresh' })
    vi.setSystemTime(1_000_100)
    expect(await readThrough(USER_A, 'insights:overview', fresh)).toEqual({ v: 'fresh' })
    expect(fresh).toHaveBeenCalledTimes(1)
  })

  it('expires entries after the TTL', async () => {
    vi.useFakeTimers({ now: 1_000_000 })
    const loader = vi.fn().mockResolvedValue({ v: 1 })
    await readThrough(USER_A, 'trends:7', loader, { ttlSeconds: 10 })
    vi.setSystemTime(1_000_000 + 11_000)
    await readThrough(USER_A, 'trends:7', loader, { ttlSeconds: 10 })
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('fails open when Redis errors', async () => {
    setCacheStore({
      hmGet: vi.fn().mockRejectedValue(Object.assign(new Error('down'), { code: 'ECONNREFUSED' })),
      hSet: vi.fn().mockRejectedValue(new Error('down')),
      expire: vi.fn().mockRejectedValue(new Error('down')),
      del: vi.fn().mockRejectedValue(new Error('down')),
    })
    expect(await readThrough(USER_A, 'dashboard:summary', async () => ({ ok: true }))).toEqual({ ok: true })
    await expect(invalidateUserCache(USER_A)).resolves.toBeUndefined()
    await expect(purgeUserCache(USER_A)).resolves.toBeUndefined()
  })

  it('fails open when Redis hangs past the timeout', async () => {
    const never = () => new Promise(() => {})
    setCacheStore({ hmGet: never, hSet: never, expire: never, del: never })
    const res = await readThrough(USER_A, 'dashboard:summary', async () => ({ ok: true }))
    expect(res).toEqual({ ok: true })
  })

  it('bypasses the cache when no store is configured', async () => {
    setCacheStore(null)
    const loader = vi.fn().mockResolvedValue({ v: 1 })
    await readThrough(USER_A, 'dashboard:summary', loader)
    await readThrough(USER_A, 'dashboard:summary', loader)
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('purge removes the whole user hash', async () => {
    await readThrough(USER_A, 'dashboard:summary', async () => ({ note: 'private' }))
    await purgeUserCache(USER_A)
    expect(store.hashes.size).toBe(0)
  })

  it('never logs cached values', async () => {
    const warn = vi.spyOn(console, 'warn')
    setCacheStore({
      hmGet: vi.fn().mockResolvedValue(['{not json', null]),
      hSet: vi.fn().mockRejectedValue(new Error('down')),
      expire: vi.fn(),
      del: vi.fn(),
    })
    await readThrough(USER_A, 'dashboard:summary', async () => ({ note: 'secret note' }))
    const logged = warn.mock.calls.flat().join(' ')
    expect(logged).not.toContain('secret note')
    expect(logged).not.toContain('{not json')
  })
})

