export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.error("[monitoring]", error, context);
  }
};

export const initMonitoring = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    // Hook for Sentry or similar when DSN is configured in deployment.
  }
};
