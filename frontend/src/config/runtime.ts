const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getBrowserOrigin = () => (typeof window !== "undefined" ? window.location.origin : "");
const normalizeApiUrl = (value: string) => {
  const trimmed = trimTrailingSlash(value);
  return /\/api\/v1$/.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
};

export const getBackendApiUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return normalizeApiUrl(configured);
  }

  const origin = getBrowserOrigin();
  return origin ? `${origin}/api/v1` : "/api/v1";
};

export const getBackendOrigin = () => {
  const apiUrl = getBackendApiUrl();
  const origin = apiUrl.replace(/\/api\/v1\/?$/, "");
  return origin || getBrowserOrigin();
};
