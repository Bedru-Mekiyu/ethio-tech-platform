const rateLimitBuckets = new Map();
const CLEANUP_INTERVAL_MS = 60 * 1000;

const DEFAULT_LIMITS = {
  api: { windowMs: 60_000, max: 60 },
  auth: { windowMs: 900_000, max: 10 },
  upload: { windowMs: 60_000, max: 5 },
  dm: { windowMs: 60_000, max: 30 },
  analytics: { windowMs: 300_000, max: 20 },
};

function getClientKey(req) {
  const userId = req.user?._id || req.user?.id;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return userId ? `user:${userId}` : `ip:${ip}`;
}

function getBucket(key, windowMs, max) {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    bucket = { windowStart: now, count: 0, max };
    rateLimitBuckets.set(key, bucket);
  }

  return bucket;
}

export const rateLimit = (type = "api", options = {}) => {
  const limits = { ...DEFAULT_LIMITS[type], ...options };

  return (req, res, next) => {
    const now = Date.now();
    const clientKey = getClientKey(req);
    const bucketKey = `${type}:${clientKey}`;
    const bucket = getBucket(bucketKey, limits.windowMs, limits.max);

    bucket.count += 1;

    const remaining = Math.max(0, limits.max - bucket.count);
    const resetAt = new Date(bucket.windowStart + limits.windowMs).toISOString();

    res.set("X-RateLimit-Limit", String(limits.max));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", resetAt);

    if (bucket.count > limits.max) {
      const retryAfter = Math.ceil((bucket.windowStart + limits.windowMs - now) / 1000);
      res.set("Retry-After", String(retryAfter));

      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter,
      });
    }

    next();
  };
};

export const globalRateLimit = rateLimit("api", { windowMs: 60_000, max: 120 });

export const authRateLimit = rateLimit("auth", { windowMs: 900_000, max: 10 });

export const dmRateLimit = rateLimit("dm", { windowMs: 60_000, max: 30 });

export const analyticsRateLimit = rateLimit("analytics", { windowMs: 300_000, max: 20 });

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now - bucket.windowStart > 300_000) {
      rateLimitBuckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);
