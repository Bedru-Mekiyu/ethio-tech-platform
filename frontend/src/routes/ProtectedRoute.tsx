import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { RouteFallback } from "@/components/layout/RouteFallback";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<"super_admin" | "admin" | "moderator" | "reviewer" | "support" | "student" | "mentor" | "parent">;
}) {
  const { accessToken, user, hydrated } = useAuthStore();
  const location = useLocation();

  if (!hydrated) {
    return <RouteFallback label="Restoring your workspace" />;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
