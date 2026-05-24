import { useEffect } from "react";
import { fetchMe } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    fetchMe()
      .then((user) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        /* token refresh or logout handled by api interceptor */
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, setUser]);

  return <>{children}</>;
}
