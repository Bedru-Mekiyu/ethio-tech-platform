const cache = new Map();
const timers = new Map();

export const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCache = (key, value, ttlMs = 15000) => {
  const expiresAt = Date.now() + ttlMs;
  cache.set(key, { value, expiresAt });

  if (timers.has(key)) clearTimeout(timers.get(key));
  const timer = setTimeout(() => { cache.delete(key); timers.delete(key); }, ttlMs);
  timer.unref?.();
  timers.set(key, timer);
};

export const clearCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    return;
  }
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      if (timers.has(key)) { clearTimeout(timers.get(key)); timers.delete(key); }
    }
  }
};

export const cacheWrapper = (fn, keyFn, ttlMs) => {
  return async (...args) => {
    const key = keyFn(...args);
    const cached = getCached(key);
    if (cached !== null) return cached;
    const result = await fn(...args);
    setCache(key, result, ttlMs);
    return result;
  };
};
