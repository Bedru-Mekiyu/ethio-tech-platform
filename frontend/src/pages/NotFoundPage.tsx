import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, BookOpen, FolderKanban, Video, MessageSquare, Users, FileCheck, BarChart3, LayoutDashboard } from "lucide-react";

const sectionRecovery: Record<string, string> = {
  "/app/tracks": "/app/tracks",
  "/app/projects": "/app/projects",
  "/app/sessions": "/app/sessions",
  "/app/squads": "/app/squads",
  "/app/messages": "/app/messages",
  "/app/lessons": "/app/tracks",
  "/app/profile": "/app/profile",
  "/mentor/sessions": "/mentor/sessions",
  "/mentor/students": "/mentor/students",
  "/mentor/reviews": "/mentor/reviews",
  "/admin/users": "/admin/users",
  "/admin/moderation": "/admin/moderation",
};

const roleSuggestions: Record<UserRole, Array<{ to: string; label: string; icon: ReactNode }>> = {
  student: [
    { to: "/app/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/app/tracks", label: "Tracks", icon: <BookOpen size={16} /> },
    { to: "/app/sessions", label: "Sessions", icon: <Video size={16} /> },
    { to: "/app/projects", label: "Projects", icon: <FolderKanban size={16} /> },
    { to: "/app/messages", label: "Messages", icon: <MessageSquare size={16} /> },
  ],
  mentor: [
    { to: "/mentor", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/mentor/sessions", label: "Sessions", icon: <Video size={16} /> },
    { to: "/mentor/students", label: "Students", icon: <Users size={16} /> },
    { to: "/mentor/reviews", label: "Reviews", icon: <FileCheck size={16} /> },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={16} /> },
    { to: "/admin/moderation", label: "Moderation", icon: <FileCheck size={16} /> },
  ],
  super_admin: [
    { to: "/admin", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={16} /> },
    { to: "/admin/moderation", label: "Moderation", icon: <FileCheck size={16} /> },
  ],
  parent: [
    { to: "/parent", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/app/progress", label: "Progress", icon: <BarChart3 size={16} /> },
    { to: "/app/sessions", label: "Sessions", icon: <Video size={16} /> },
  ],
  moderator: [
    { to: "/admin", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { to: "/admin/moderation", label: "Moderation", icon: <FileCheck size={16} /> },
  ],
  reviewer: [
    { to: "/admin", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { to: "/admin/moderation", label: "Moderation", icon: <FileCheck size={16} /> },
  ],
  support: [
    { to: "/admin", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={16} /> },
  ],
};

function recoverableSection(pathname: string): string | null {
  for (const [prefix, target] of Object.entries(sectionRecovery)) {
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
      return target;
    }
  }
  return null;
}

export function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [countdown, setCountdown] = useState(4);
  const redirected = useRef(false);

  const recovery = useMemo(() => recoverableSection(location.pathname), [location.pathname]);

  const suggestions = useMemo(() => {
    if (!user) {
      return [
        { to: "/", label: "Home", icon: <Home size={16} /> },
        { to: "/how-it-works", label: "Programs", icon: <BookOpen size={16} /> },
        { to: "/mentors", label: "Mentors", icon: <Users size={16} /> },
        { to: "/contact", label: "Contact", icon: <MessageSquare size={16} /> },
      ];
    }
    return roleSuggestions[user.role] ?? roleSuggestions.student;
  }, [user]);

  useEffect(() => {
    if (!recovery || redirected.current) return;
    redirected.current = true;

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate(recovery, { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [recovery, navigate]);

  const canGoBack = window.history.length > 1;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border border-[#27272A] bg-[#0E0E11] p-6 sm:p-8 text-center">
          <p className="text-xs uppercase tracking-wider text-violet-400 font-semibold">404</p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-white">Page not found</h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            The page you requested does not exist or has moved.
          </p>

          {import.meta.env.DEV && (
            <p className="mt-3 text-[11px] text-zinc-500 break-all font-mono">
              {location.pathname}
            </p>
          )}

          {recovery && (
            <div className="mt-5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3.5 py-2.5">
              <p className="text-xs text-zinc-400">
                Redirecting to{" "}
                <span className="font-medium text-violet-400">{recovery}</span> in{" "}
                <span className="font-semibold text-white">{countdown}</span>s...
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {canGoBack && (
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft size={14} className="mr-1.5" />
                Return to previous page
              </Button>
            )}
            <Link to={user ? (user.role === "mentor" ? "/mentor" : user.role === "admin" || user.role === "super_admin" || user.role === "moderator" || user.role === "reviewer" || user.role === "support" ? "/admin" : user.role === "parent" ? "/parent" : "/app/dashboard") : "/"}>
              <Button size="sm">
                <Home size={14} className="mr-1.5" />
                Go home
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-center text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
            Suggested destinations
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <Link key={s.to} to={s.to}>
                <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-white">
                  {s.icon}
                  <span className="ml-1.5">{s.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
