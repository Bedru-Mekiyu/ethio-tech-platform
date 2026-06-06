const getJitsiConfig = () => ({
  domain: process.env.JITSI_DOMAIN || "meet.jit.si",
  appId: process.env.JITSI_APP_ID || "",
  sharedSecret: process.env.JITSI_SHARED_SECRET || "",
  enabled: true,
});

const isJitsiEnabled = () => true;

export { getJitsiConfig, isJitsiEnabled };
