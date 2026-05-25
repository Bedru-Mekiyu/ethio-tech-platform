import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="fixed left-0 right-0 top-0 z-[9999] flex items-center justify-center gap-2 bg-[var(--warning)] px-4 py-2 text-sm font-medium text-black"
    >
      <WifiOff size={16} />
      <span>You are offline. Some features may be unavailable.</span>
    </div>
  );
}
