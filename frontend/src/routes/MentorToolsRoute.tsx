import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { RouteFallback } from "@/components/layout/RouteFallback";

export function MentorToolsRoute() {
  const { hydrated, user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!hydrated) {
    return <RouteFallback label="Loading mentor tools" />;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === "admin") {
    return <Outlet />;
  }

  if (user.role !== "mentor") {
    return <Navigate to="/" replace />;
  }

  const mentorApproved = user.mentorStatus === "approved" || user.isVerified === true;
  if (!mentorApproved) {
    return <Navigate to="/mentor" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
