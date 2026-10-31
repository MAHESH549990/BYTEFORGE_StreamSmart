const cache = new Map();

const MAX_CACHE_BYTES = 128 * 1024 * 1024; // 128 MB
const MAX_ENTRY_BYTES = 32 * 1024 * 1024; // 32 MB

let currentCacheBytes = 0;

const statistics = {
  requests: 0,
  hits: 0,
  misses: 0,
  originBytesFetched: 0,
  cacheBytesServed: 0,
  evictions: 0,
};

// Remove an existing cache entry.
const removeEntry = (key) => {
  const entry = cache.get(key);

  if (!entry) return;

  currentCacheBytes -= entry.body.length;
  cache.delete(key);
};

// Retrieve a resource from cache.
export const getCachedResource = (key) => {
  statistics.requests++;

  const entry = cache.get(key);

  if (!entry) {
    statistics.misses++;
    return null;
  }

  // Check expiration.
  if (Date.now() > entry.expiresAt) {
    removeEntry(key);
    statistics.misses++;
    return null;
  }

  // Refresh insertion order for LRU eviction.
  cache.delete(key);
  cache.set(key, entry);

  statistics.hits++;
  statistics.cacheBytesServed += entry.body.length;

  return entry;
};

// Save a resource in cache.
export const setCachedResource = (
  key,
  body,
  contentType,
  ttl = 300000,
  status = 200,
  responseHeaders = {}
) => {
  const buffer = Buffer.isBuffer(body)
    ? body
    : Buffer.from(body);

  // Do not cache unusually large resources.
  if (buffer.length > MAX_ENTRY_BYTES) {
    return false;
  }

  if (cache.has(key)) {
    removeEntry(key);
  }

  // Remove old entries until enough space is available.
  while (
    currentCacheBytes + buffer.length > MAX_CACHE_BYTES &&
    cache.size > 0
  ) {
    const oldestKey = cache.keys().next().value;

    removeEntry(oldestKey);
    statistics.evictions++;
  }

  const entry = {
    body: buffer,
    contentType,
    status,
    responseHeaders,
    expiresAt: Date.now() + ttl,
  };

  cache.set(key, entry);

  currentCacheBytes += buffer.length;

  return true;
};

// Record bytes fetched from the origin server.
export const recordOriginBytes = (bytes) => {
  statistics.originBytesFetched += Number(bytes) || 0;
};

// Return edge cache analytics.
export const getEdgeCacheStats = () => {
  const hitRate =
    statistics.requests > 0
      ? (statistics.hits / statistics.requests) * 100
      : 0;

  return {
    ...statistics,

    cacheEntries: cache.size,

    cacheSizeMB: Number(
      (currentCacheBytes / (1024 * 1024)).toFixed(2)
    ),

    hitRate: Number(hitRate.toFixed(2)),

    maxCacheSizeMB: MAX_CACHE_BYTES / (1024 * 1024),
  };
};

// Clear cached resources.
export const clearEdgeCache = () => {
  cache.clear();
  currentCacheBytes = 0;
};