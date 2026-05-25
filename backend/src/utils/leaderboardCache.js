const cache = new Map();
const TTL_MS = 60_000;

export const getCachedLeaderboard = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCachedLeaderboard = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
};
