// Per-user read-through cache for expensive read models (dashboard summary,
// insights overview, trends). Postgres stays the source of truth; Redis only
// shortens repeat loads.
//
// Layout: one Redis hash per user — `steady:v1:user:<userId>` — with one field
// per read model plus an `_inv` field holding the last invalidation time.
// Each cached field stores { at, exp, data }:
//   - `at`  = when the loader STARTED reading the DB
//   - `exp` = absolute expiry (hash TTL alone can't expire single fields)
// An entry is served only if it is unexpired AND was loaded after the last
// invalidation (at > _inv). That closes the race where a slow read that began
// before a write would otherwise re-cache stale data after the write.
//
// Fail-open: any Redis error/timeout => call the loader (DB) and carry on.
// Keys contain only the user id; values are never logged.
import { env } from "../../config/env.js";
import { getRedisClient } from "./redis.client.js";

const KEY_PREFIX = "steady:v1:user:";
const INVALIDATED_FIELD = "_inv";

// undefined => use the real Redis client; tests inject an in-memory store
// (or null to force-disable).
let storeOverride;

export function setCacheStore(store) {
  storeOverride = store;
}

function getStore() {
  return storeOverride !== undefined ? storeOverride : getRedisClient();
}

const userKey = (userId) => `${KEY_PREFIX}${userId}`;

function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error("Cache operation timed out.");
      err.code = "CACHE_TIMEOUT";
      reject(err);
    }, env.CACHE_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function logCacheError(op, err) {
  console.warn(
    JSON.stringify({ level: "warn", event: "cache.error", op, code: err?.code ?? "CACHE_ERROR" }),
  );
}

/**
 * Return the cached value for (userId, name) or load it from the DB and cache it.
 * @param {string} userId - always req.user.id; scopes the cache like every query
 * @param {string} name - read-model name, e.g. "dashboard:summary"
 * @param {() => Promise<any>} loader - DB-backed producer of the JSON payload
 */
export async function readThrough(userId, name, loader, { ttlSeconds = env.CACHE_TTL_SECONDS } = {}) {
  const store = getStore();
  if (!store || !userId || ttlSeconds <= 0) return loader();

  const key = userKey(userId);
  let invalidatedAt = 0;
  try {
    const [raw, inv] = await withTimeout(store.hmGet(key, [name, INVALIDATED_FIELD]));
    invalidatedAt = Number(inv) || 0;
    if (raw) {
      const entry = JSON.parse(raw);
      if (entry.exp > Date.now() && entry.at > invalidatedAt) return entry.data;
    }
  } catch (err) {
    logCacheError("read", err);
  }

  const startedAt = Date.now();
  const data = await loader();

  try {
    const entry = JSON.stringify({ at: startedAt, exp: startedAt + ttlSeconds * 1000, data });
    await withTimeout(store.hSet(key, name, entry));
    // Refresh the hash TTL so it (and _inv) outlives its newest entry.
    await withTimeout(store.expire(key, ttlSeconds));
  } catch (err) {
    logCacheError("write", err);
  }
  return data;
}

/**
 * Mark every cached read model for this user stale. Call after any write that
 * changes check-ins, insights, or reminders. Never throws.
 */
export async function invalidateUserCache(userId) {
  const store = getStore();
  if (!store || !userId) return;
  const key = userKey(userId);
  try {
    // Max with now+1 so an entry loaded in this same millisecond is rejected.
    await withTimeout(store.hSet(key, INVALIDATED_FIELD, String(Date.now() + 1)));
    await withTimeout(store.expire(key, Math.max(env.CACHE_TTL_SECONDS, 1)));
  } catch (err) {
    logCacheError("invalidate", err);
  }
}

/** Drop the user's cache entirely (account deletion: cached notes must go too). */
export async function purgeUserCache(userId) {
  const store = getStore();
  if (!store || !userId) return;
  try {
    await withTimeout(store.del(userKey(userId)));
  } catch (err) {
    logCacheError("purge", err);
  }
}

