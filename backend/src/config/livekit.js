import { getEnv } from "./env.js";

export const getLiveKitConfig = () => {
  const env = getEnv();
  return {
    url: env.livekitUrl || "wss://livekit.example.com",
    apiKey: env.livekitApiKey || "devkey",
    apiSecret: env.livekitApiSecret || "secret_key_1234567890_min16chars",
    enabled: Boolean(env.livekitUrl),
  };
};

export const isLiveKitEnabled = () => {
  const config = getLiveKitConfig();
  return Boolean(config.url && config.apiKey && config.apiSecret);
};
