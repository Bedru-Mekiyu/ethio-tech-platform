import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import { RankProgress } from "@/components/composites/StatCard";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { getRankTitle, cn } from "@/lib/utils";
import { getSettingsPath } from "@/store/authStore";
import { useQuickNavLinks } from "@/hooks/useQuickNavLinks";
import { motion, AnimatePresence } from "framer-motion";
import { logoutApi } from "@/services/authService";
import { fetchUnreadCount } from "@/services/notificationsService";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Users,
  MessageSquare,
  Settings,
  Bell,
  Video,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  CalendarClock,
  FileCheck,
  Trophy,
  Activity,
  Award,
  Mail,
  Calendar,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: React.ReactNode };

export function DashboardLayout({ variant = "student" }: { variant?: "student" | "mentor" | "admin" | "parent" }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const notifBadge = useNotificationStore((s) => s.badge);
  const setBadgeCount = useNotificationStore((s) => s.setBadgeCount);
  const { squadPath } = useQuickNavLinks({ enabled: variant === "student" || variant === "mentor" });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount()
      .then(setBadgeCount)
      .catch(() => undefined);
  }, [user, setBadgeCount]);

  useEffect(() => {
    if (!user?.id) return;

    let cleanup: (() => void) | undefined;

    // Defer socket notification listener — after page is interactive
    const timer = setTimeout(() => {
      import("@/services/socket").then(({ getSocket }) => {
        const socket = getSocket();
        const handleCount = (payload: { userId: string; count: number }) => {
          if (payload.userId === user?.id) {
            setBadgeCount(payload.count);
          }
        };
        socket.on("notification:count", handleCount);
        cleanup = () => {
          socket.off("notification:count", handleCount);
        };
      });
    }, 800);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [user?.id, setBadgeCount]);

  const handleLogout = useCallback(async () => {
    setAccountOpen(false);
    try {
      await logoutApi();
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", handleFocusTrap);
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }, 100);
    const buttonEl = openButtonRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", handleFocusTrap);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      buttonEl?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const studentNav: NavItem[] = [
    { to: "/app/dashboard", label: "Home", icon: <LayoutDashboard size={18} /> },
    { to: "/app/tracks", label: "Tracks", icon: <BookOpen size={18} /> },
    { to: "/app/projects", label: "Projects", icon: <FolderKanban size={18} /> },
    { to: "/app/sessions", label: "Sessions", icon: <Video size={18} /> },
    { to: "/app/squads", label: "Squads", icon: <MessageSquare size={18} /> },
    { to: "/app/progress", label: "Progress", icon: <BarChart3 size={18} /> },
    { to: "/app/mentors", label: "Mentors", icon: <Users size={18} /> },
    { to: "/app/messages", label: "Messages", icon: <Mail size={18} /> },
    { to: "/app/calendar", label: "Calendar", icon: <Calendar size={18} /> },
    { to: "/app/certificates", label: "Certificates", icon: <Award size={18} /> },
  ];

  const mentorNav: NavItem[] = [
    { to: "/mentor", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/mentor/sessions", label: "Sessions", icon: <BookOpen size={18} /> },
    { to: "/mentor/students", label: "My Students", icon: <Users size={18} /> },
    { to: "/mentor/availability", label: "Availability", icon: <CalendarClock size={18} /> },
    { to: "/mentor/reviews", label: "Project Reviews", icon: <FileCheck size={18} /> },
    { to: "/mentor/notifications", label: "Notifications", icon: <Bell size={18} /> },
    { to: squadPath, label: "Community", icon: <MessageSquare size={18} /> },
  ];

  const parentNav: NavItem[] = [
    { to: "/parent", label: "Home", icon: <LayoutDashboard size={18} /> },
    { to: "/app/progress", label: "Child's Progress", icon: <BarChart3 size={18} /> },
    { to: "/app/sessions", label: "Child's Sessions", icon: <Video size={18} /> },
    { to: "/app/notifications", label: "Notifications", icon: <Bell size={18} /> },
    { to: "/contact", label: "Support", icon: <MessageSquare size={18} /> },
  ];

  const adminNav: NavItem[] = [
    { to: "/admin", label: "Analytics", icon: <BarChart3 size={18} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={18} /> },
    { to: "/admin/moderation", label: "Applications", icon: <FileCheck size={18} /> },
    { to: "/admin/content", label: "Content", icon: <BookOpen size={18} /> },
    { to: "/admin/gamification", label: "Gamification", icon: <Trophy size={18} /> },
    { to: "/admin/meetings", label: "Meetings", icon: <Video size={18} /> },
    { to: "/admin/operations", label: "Operations", icon: <Activity size={18} /> },
  ];

  const nav =
    variant === "mentor" ? mentorNav : variant === "admin" ? adminNav : variant === "parent" ? parentNav : studentNav;
  const renderNavItems = (isMobile: boolean = false) =>
    nav.map((item) => (
      <NavLink
        key={item.to + item.label}
        to={item.to}
        end
        onClick={() => isMobile && setMobileOpen(false)}
        className={({ isActive }) =>
          cn(
            "group relative flex items-center gap-3 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors duration-150 select-none border border-transparent",
            isActive
              ? "bg-zinc-100 text-zinc-900 font-semibold border-zinc-200 shadow-xs"
              : "text-zinc-600 hover:bg-zinc-100/60 hover:text-zinc-900",
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.div
                layoutId={isMobile ? "active-mobile-drawer-indicator" : "active-sidebar-indicator"}
                className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span
              className={cn(
                "transition-transform duration-150",
                isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-700",
              )}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    ));

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden w-66 flex-shrink-0 flex-col border-r border-zinc-200 bg-white p-5 lg:flex">
        <Logo to="/" />
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
          {renderNavItems(false)}
        </nav>
        <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4">
          <Link
            to={getSettingsPath(user?.role ?? variant)}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-200 border border-transparent hover:bg-zinc-100 hover:border-zinc-200"
          >
            <Settings size={15} /> Settings
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer (Animated) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs lg:hidden"
            />
            <motion.aside
              ref={drawerRef}
              id="mobile-nav-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-66 flex-col border-r border-zinc-200 bg-white p-5 lg:hidden shadow-2xl"
              role="dialog"
              aria-label="Navigation Menu"
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo to="/" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors duration-200 min-h-9 min-w-9 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
                {renderNavItems(true)}
              </nav>
              <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4">
                <Link
                  to={getSettingsPath(user?.role ?? variant)}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-200 border border-transparent hover:bg-zinc-100 hover:border-zinc-200"
                >
                  <Settings size={15} /> Settings
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 lg:pb-0">
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-4 py-3.5 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              ref={openButtonRef}
              type="button"
              className="min-h-9 min-w-9 rounded-lg border border-zinc-200 p-2 lg:hidden flex items-center justify-center hover:bg-zinc-100 text-zinc-700 transition-colors duration-200"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu size={18} />
            </button>
            {variant === "parent" ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">
                  Family Workspace
                </Badge>
                <span className="text-xs font-medium text-zinc-500">Parent View</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:inline">
                  Rank
                </span>
                <span className="text-xs font-bold text-zinc-900">{getRankTitle(user?.level ?? 1)}</span>
                {user && <RankProgress level={user.level ?? 1} xp={user.xp ?? 0} />}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={
                variant === "mentor"
                  ? "/mentor/notifications"
                  : variant === "admin"
                    ? "/admin/notifications"
                    : "/app/notifications"
              }
              className="relative p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors duration-200 min-w-9 min-h-9 flex items-center justify-center border border-transparent hover:border-zinc-200"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifBadge.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                  {notifBadge.count > 99 ? "99+" : notifBadge.count}
                </span>
              )}
            </Link>
            {user && (
              <div className="relative border-l border-zinc-200 pl-3" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="flex items-center gap-2 min-h-9 rounded-lg p-1 hover:bg-zinc-100 transition-colors duration-200"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  <Avatar
                    src={user.avatarUrl ?? user.avatar}
                    name={user.fullName || user.email || "User"}
                    userId={user.id}
                    role={user.role === "mentor" ? "mentor" : "student"}
                    size="sm"
                    status="online"
                  />
                  <ChevronDown
                    size={12}
                    className={cn("text-zinc-500 transition-transform duration-200", accountOpen && "rotate-180")}
                  />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-zinc-200 bg-white shadow-xl z-50 py-1">
                    <div className="px-3.5 py-2.5 border-b border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      to={
                        variant === "student"
                          ? "/app/profile"
                          : variant === "mentor"
                            ? "/mentor/profile"
                            : "/admin/profile"
                      }
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                      <User size={13} /> Profile
                    </Link>
                    <Link
                      to={getSettingsPath(user.role)}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                      <Settings size={13} /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors border-t border-zinc-100"
                    >
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main id="main-content" className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 overflow-y-auto scroll-smooth">
          <Outlet />
        </main>

        {/* Mobile bottom nav with sliding layout indicator */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] lg:hidden backdrop-blur-md"
          aria-label="Mobile navigation"
        >
          {(variant === "student"
            ? [
                { to: "/app/dashboard", label: "Home", icon: <LayoutDashboard size={18} /> },
                { to: "/app/tracks", label: "Tracks", icon: <BookOpen size={18} /> },
                { to: "/app/sessions", label: "Sessions", icon: <Video size={18} /> },
                { to: "/app/progress", label: "Progress", icon: <BarChart3 size={18} /> },
              ]
            : nav.slice(0, 4)
          ).map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-zinc-500 transition-colors duration-200 select-none",
                  isActive ? "text-primary font-bold" : "hover:text-zinc-900",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-bottom-bar-indicator"
                      className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-primary shadow-[0_1px_4px_rgba(185,28,28,0.25)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      "transition-transform duration-200",
                      isActive ? "scale-110 text-primary" : "scale-100",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label.split(" ")[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
