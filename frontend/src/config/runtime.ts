const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getBrowserOrigin = () => (typeof window !== "undefined" ? window.location.origin : "");

export const getBackendApiUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  const origin = getBrowserOrigin();
  return origin ? `${origin}/api/v1` : "/api/v1";
};

export const getBackendOrigin = () => {
  const apiUrl = getBackendApiUrl();
  const origin = apiUrl.replace(/\/api\/v1\/?$/, "");
  return origin || getBrowserOrigin();
};
