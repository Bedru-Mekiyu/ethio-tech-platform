const isTest = process.env.NODE_ENV === "test";

let cached = null;

export const getAgoraConfig = () => {
  if (cached) return cached;

  const appId = process.env.AGORA_APP_ID || "";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";
  const enabled = Boolean(appId && appCertificate);

  if (!isTest && enabled) {
    if (appId.length < 10) {
      console.warn("[Agora] AGORA_APP_ID appears too short — video may not work");
    }
    if (appCertificate.length < 10) {
      console.warn("[Agora] AGORA_APP_CERTIFICATE appears too short — token generation may fail");
    }
  }

  cached = { appId, appCertificate, enabled };
  return cached;
};

export const isAgoraEnabled = () => getAgoraConfig().enabled;
