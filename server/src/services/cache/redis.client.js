// Lazy, fail-open Redis connection for the read cache.
// - Disabled entirely when REDIS_URL is unset (returns null => callers hit the DB).
// - Never blocks a request on connecting: until the client is ready, callers
//   get null and fall through to Postgres while the connection warms up.
// - disableOfflineQueue makes commands fail fast while disconnected instead of
//   piling up behind a dead socket.
// Logs only safe error codes — never the URL (it can embed a password).
import { createClient } from "redis";
import { env } from "../../config/env.js";

const ERROR_LOG_INTERVAL_MS = 60_000;

let client = null;
let lastErrorLogAt = 0;

function logRedisError(err) {
  const now = Date.now();
  if (now - lastErrorLogAt < ERROR_LOG_INTERVAL_MS) return;
  lastErrorLogAt = now;
  console.warn(
    JSON.stringify({ level: "warn", event: "cache.redis_error", code: err?.code ?? "REDIS_ERROR" }),
  );
}

function startConnecting() {
  client = createClient({
    url: env.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 2000,
      // Keep retrying in the background with capped backoff; requests are
      // served from the DB in the meantime.
      reconnectStrategy: (retries) => Math.min(retries * 500, 10_000),
    },
  });
  client.on("error", logRedisError);
  client.connect().catch(logRedisError);
}

export function getRedisClient() {
  if (!env.REDIS_URL) return null;
  if (!client) startConnecting();
  return client.isReady ? client : null;
}

export async function closeRedisClient() {
  if (!client) return;
  const current = client;
  client = null;
  try {
    await current.close();
  } catch {
    current.destroy();
  }
}
