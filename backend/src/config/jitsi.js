const getJitsiConfig = () => ({
  domain: process.env.JITSI_DOMAIN || "meet.jit.si",
  appId: process.env.JITSI_APP_ID || "",
  apiKey: process.env.JITSI_API_KEY || "",
  sharedSecret: process.env.JITSI_SHARED_SECRET || "",
  enabled: Boolean(process.env.JITSI_DOMAIN),
});

const isJitsiEnabled = () => Boolean(process.env.JITSI_DOMAIN);

export { getJitsiConfig, isJitsiEnabled };
