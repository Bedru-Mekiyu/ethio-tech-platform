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
      className="fixed left-3 right-3 top-3 z-[9999] flex items-center justify-center gap-2 rounded-2xl border border-warning/30 bg-[rgba(17,24,35,0.94)] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md sm:left-4 sm:right-4"
    >
      <WifiOff size={16} className="text-warning" />
      <span>You are offline. Messages will queue until the connection returns.</span>
    </div>
  );
}
