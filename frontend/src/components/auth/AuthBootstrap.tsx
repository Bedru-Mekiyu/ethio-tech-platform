import { useEffect } from "react";
import { getMyProfile } from "@/services/userService";
import { useAuthStore } from "@/store/authStore";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!accessToken) return;

    // Skip re-fetch if user data is already populated from localStorage rehydration.
    // The AuthBootstrap only needs to fetch when there's a token but no user object
    // (e.g. token persisted but user data missing from storage).
    if (useAuthStore.getState().user) return;

    let cancelled = false;
    getMyProfile()
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
