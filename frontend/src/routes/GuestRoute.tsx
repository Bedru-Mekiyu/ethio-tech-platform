import { Navigate } from "react-router-dom";
import { useAuthStore, getDashboardPath } from "@/store/authStore";
import { RouteFallback } from "@/components/layout/RouteFallback";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, user, hydrated } = useAuthStore();

  if (!hydrated) {
    return <RouteFallback label="Loading" />;
  }

  if (accessToken && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
