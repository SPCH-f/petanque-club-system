const Redis   = require('ioredis');
const { logger } = require('../utils/logger');

let client = null;
let usingFallback = false;

// In-memory fallback cache
const memCache = new Map();

function createRedisClient() {
  const redisClient = new Redis({
    host:     process.env.REDIS_HOST     || 'localhost',
    port:     parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying
      return Math.min(times * 200, 3000);
    },
  });

  redisClient.on('connect',  () => logger.info('✅ Redis connected'));
  redisClient.on('error',    (err) => {
    logger.warn('⚠️  Redis error (falling back to in-memory):', err.message);
    usingFallback = true;
  });

  return redisClient;
}

try {
  client = createRedisClient();
  client.connect().catch(() => { usingFallback = true; });
} catch {
  usingFallback = true;
}

// ── Cache API ─────────────────────────────────────────────────
const cache = {
  async get(key) {
    if (usingFallback) {
      const item = memCache.get(key);
      if (!item) return null;
      if (item.expiry && Date.now() > item.expiry) { memCache.delete(key); return null; }
      return item.value;
    }
    try {
      const val = await client.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },

  async set(key, value, ttlSeconds = 300) {
    if (usingFallback) {
      memCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
      return;
    }
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch { /* ignore */ }
  },

  async del(key) {
    if (usingFallback) { memCache.delete(key); return; }
    try { await client.del(key); } catch { /* ignore */ }
  },

  async delPattern(pattern) {
    if (usingFallback) {
      for (const k of memCache.keys()) {
        if (k.startsWith(pattern.replace('*', ''))) memCache.delete(k);
      }
      return;
    }
    try {
      const keys = await client.keys(pattern);
      if (keys.length) await client.del(...keys);
    } catch { /* ignore */ }
  },
};

module.exports = cache;
