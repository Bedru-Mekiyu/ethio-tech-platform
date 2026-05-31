const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const parseOrigins = (value) =>
  value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const requireSecret = (name, value, minLength = 16) => {
  if (isTest && !value) {
    return value || `test-${name}-secret-min-16-chars`;
  }
  if (!value || value.length < minLength) {
    if (isProduction) {
      throw new Error(`${name} must be set and at least ${minLength} characters in production`);
    }
    return value || `dev-${name}-secret-min-16`;
  }
  return value;
};

let cached = null;

export const getEnv = () => {
  if (cached) return cached;

  cached = {
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction,
    isTest,
    port: Number(process.env.PORT) || 5000,
    mongoUri: process.env.MONGO_URI || process.env.MONGODB_URL,
    corsOrigin: parseOrigins(process.env.CORS_ORIGIN),
    jwtSecret: requireSecret("JWT_SECRET", process.env.JWT_SECRET),
    jwtRefreshSecret: requireSecret("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),
    liveClassroomSecret: requireSecret("LIVE_CLASSROOM_SECRET", process.env.LIVE_CLASSROOM_SECRET),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
    jwtRefreshDays: Number(process.env.JWT_REFRESH_DAYS || 14),
    logLevel: process.env.LOG_LEVEL || "info",
  };

  if (!cached.mongoUri && isProduction) {
    throw new Error("MONGO_URI is required in production");
  }

  if (isProduction && cached.corsOrigin.length === 0) {
    throw new Error("CORS_ORIGIN is required in production");
  }

  return cached;
};

export const validateEnvOnBoot = () => {
  getEnv();
};
