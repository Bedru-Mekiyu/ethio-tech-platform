const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const PLACEHOLDER_PATTERNS = ["change-me", "changeme", "placeholder", "your-secret", "secret-key", "default"];

const parseOrigins = (value) =>
  value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const isPlaceholder = (value) => {
  if (!value) return false;
  const lower = value.toLowerCase();
  const stripped = lower.replace(/[-_]/g, "");
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p) || stripped.includes(p.replace(/[-_]/g, "")));
};

const requireSecret = (name, value, minLength = 16) => {
  if (isTest && !value) {
    return value || `test-${name}-secret-min-16-chars`;
  }
  if (!value) {
    throw new Error(`${name} is required`);
  }
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters (got ${value.length})`);
  }
  if (isPlaceholder(value)) {
    throw new Error(`${name} contains a placeholder value. Generate a strong secret.`);
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
    featureAttendanceVerification: process.env.FEATURE_ATTENDANCE_VERIFICATION === "true",
    livekitUrl: process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST || "wss://livekit.example.com",
    livekitApiKey: process.env.LIVEKIT_API_KEY || "devkey",
    livekitApiSecret: process.env.LIVEKIT_API_SECRET || "secret_key_1234567890_min16chars",
    jitsiDomain: process.env.JITSI_DOMAIN || "meet.jit.si",
    jitsiAppId: process.env.JITSI_APP_ID || "",
    jitsiSharedSecret: process.env.JITSI_SHARED_SECRET || "",
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: Number(process.env.SMTP_PORT || 587),
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    smtpFrom: process.env.SMTP_FROM || "",
    appUrl: process.env.APP_URL || "http://localhost:5173",
    credentialsExpiryHours: Number(process.env.CREDENTIALS_EXPIRY_HOURS || 24),
  };

  if (!cached.mongoUri && !isTest) {
    throw new Error("MONGO_URI is required");
  }

  if (isProduction && cached.corsOrigin.length === 0) {
    throw new Error("CORS_ORIGIN is required in production");
  }

  return cached;
};

export const validateEnvOnBoot = () => {
  getEnv();
};
