import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import { RankProgress } from "@/components/composites/StatCard";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { getRankTitle, cn } from "@/lib/utils";
import { getSettingsPath } from "@/store/authStore";
import { useQuickNavLinks } from "@/hooks/useQuickNavLinks";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Users,
  Trophy,
  MessageSquare,
  Award,
  Settings,
  Bell,
  Video,
  FileCheck,
  BarChart3,
  Activity,
  Menu,
  X,
  CalendarClock,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: React.ReactNode };

export function DashboardLayout({ variant = "student" }: { variant?: "student" | "mentor" | "admin" | "parent" }) {
  const user = useAuthStore((s) => s.user);
  const { classroomPath, squadPath } = useQuickNavLinks({ enabled: variant === "student" || variant === "mentor" });
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentNav: NavItem[] = [
    { to: "/app/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/app/tracks", label: "Learning Tracks", icon: <BookOpen size={18} /> },
    { to: "/app/progress", label: "Progress", icon: <BarChart3 size={18} /> },
    { to: "/app/projects", label: "Projects", icon: <FolderKanban size={18} /> },
    { to: "/app/squads", label: "Squads", icon: <MessageSquare size={18} /> },
    { to: classroomPath, label: "Virtual Class", icon: <Video size={18} /> },
    { to: "/app/workspace", label: "Workspace", icon: <Activity size={18} /> },
    { to: "/app/notifications", label: "Notifications", icon: <Bell size={18} /> },
    { to: "/app/achievements", label: "Achievements", icon: <Award size={18} /> },
    { to: "/app/sessions", label: "Sessions", icon: <Video size={18} /> },
    { to: "/leaderboard", label: "Leaderboard", icon: <Trophy size={18} /> },
  ];

  const mentorNav: NavItem[] = [
    { to: "/mentor", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/mentor/sessions", label: "Sessions", icon: <BookOpen size={18} /> },
    { to: "/mentor/availability", label: "Availability", icon: <CalendarClock size={18} /> },
    { to: "/mentor/reviews", label: "Project Reviews", icon: <FileCheck size={18} /> },
    { to: "/mentor/notifications", label: "Notifications", icon: <Bell size={18} /> },
    { to: squadPath, label: "Community", icon: <Users size={18} /> },
  ];

  const parentNav: NavItem[] = [
    { to: "/parent", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/app/dashboard", label: "Progress", icon: <BarChart3 size={18} /> },
    { to: "/app/sessions", label: "Sessions", icon: <Video size={18} /> },
    { to: "/app/notifications", label: "Notifications", icon: <Bell size={18} /> },
    { to: "/contact", label: "Support", icon: <MessageSquare size={18} /> },
  ];

  const adminNav: NavItem[] = [
    { to: "/admin", label: "Analytics", icon: <BarChart3 size={18} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={18} /> },
    { to: "/admin/moderation", label: "Moderation", icon: <FileCheck size={18} /> },
    { to: "/admin/content", label: "Content", icon: <BookOpen size={18} /> },
    { to: "/admin/gamification", label: "Gamification", icon: <Trophy size={18} /> },
    { to: "/admin/operations", label: "Operations", icon: <Activity size={18} /> },
  ];

  const nav = variant === "mentor" ? mentorNav : variant === "admin" ? adminNav : variant === "parent" ? parentNav : studentNav;
  const homePath =
    variant === "parent" || user?.role === "parent"
      ? "/parent"
      : variant === "student"
        ? "/app/dashboard"
        : variant === "mentor"
          ? "/mentor"
          : "/admin";

  const navItems = nav.map((item) => (
    <NavLink
      key={item.to + item.label}
      to={item.to}
      end
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-white/5 hover:text-white",
          isActive && "border border-primary/30 bg-primary/10 text-primary"
        )
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  ));

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to main content
      </a>
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] p-4 lg:flex">
        <Logo to={homePath} />
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems}
        </nav>
        <Link
          to={getSettingsPath(user?.role ?? variant)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] hover:text-white"
        >
          <Settings size={18} /> Settings
        </Link>
        {user && (
          <div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-4">
            <Avatar name={user.fullName} size="sm" />
            <div>
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs capitalize text-[var(--text-muted)]">{user.role}</p>
            </div>
          </div>
        )}
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <Logo to={homePath} />
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col pb-16 lg:pb-0">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] p-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            {variant === "parent" ? (
              <div className="flex items-center gap-3">
                <Badge variant="purple">Family workspace</Badge>
                <span className="text-sm text-[var(--text-secondary)]">Parent view</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="hidden text-xs uppercase text-[var(--text-muted)] sm:inline">Current rank</span>
                <span className="font-semibold text-primary">{getRankTitle(user?.level ?? 1)}</span>
                {user && <RankProgress level={user.level ?? 1} xp={user.xp ?? 0} />}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={
                variant === "mentor"
                  ? "/mentor/notifications"
                  : variant === "student" || variant === "parent" || user?.role === "parent"
                    ? "/app/notifications"
                    : "/admin"
              }
              className="text-[var(--text-secondary)] hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </Link>
            {user && (
              <div className="flex items-center gap-2">
                <Avatar name={user.fullName} />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs capitalize text-[var(--text-muted)]">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>
        <main id="main-content" className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--border)] bg-[var(--bg-elevated)] lg:hidden"
          aria-label="Mobile navigation"
        >
          {(variant === "student"
            ? [
                { to: "/app/dashboard", label: "Home", icon: <LayoutDashboard size={18} /> },
                { to: "/app/tracks", label: "Tracks", icon: <BookOpen size={18} /> },
                { to: "/app/progress", label: "Progress", icon: <BarChart3 size={18} /> },
                { to: "/app/notifications", label: "Alerts", icon: <Bell size={18} /> },
              ]
            : nav.slice(0, 4)
          ).map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] text-[var(--text-muted)]",
                  isActive && "text-primary"
                )
              }
            >
              {item.icon}
              <span>{item.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
