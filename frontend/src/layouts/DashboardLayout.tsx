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
import { getSocket } from "@/services/socket";
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
    const socket = getSocket();
    const handleCount = (payload: { userId: string; count: number }) => {
      if (payload.userId === user?.id) {
        setBadgeCount(payload.count);
      }
    };
    socket.on("notification:count", handleCount);
    return () => {
      socket.off("notification:count", handleCount);
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
    { to: "/app/progress", label: "Progress", icon: <BarChart3 size={18} /> },
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
            "group relative flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 select-none border border-transparent",
            isActive
              ? "bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(99,102,241,0.08)] border-primary/25"
              : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white",
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.div
                layoutId={isMobile ? "active-mobile-drawer-glow" : "active-sidebar-glow"}
                className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-primary"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span
              className={cn(
                "transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary" : "text-[var(--text-muted)] group-hover:text-white",
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
    <div className="flex min-h-screen bg-[#050507]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden w-66 flex-shrink-0 flex-col border-r border-[#27272A] bg-[#0E0E11] p-5 lg:flex">
        <Logo to="/" />
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
          {renderNavItems(false)}
        </nav>
        <div className="mt-4 flex flex-col gap-3 border-t border-[#27272A] pt-4">
          <Link
            to={getSettingsPath(user?.role ?? variant)}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors duration-200 border border-transparent hover:bg-[#141418] hover:border-[#27272A]"
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
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[4px] lg:hidden"
            />
            <motion.aside
              ref={drawerRef}
              id="mobile-nav-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-66 flex-col border-r border-[#27272A] bg-[#0E0E11] p-5 lg:hidden shadow-2xl"
              role="dialog"
              aria-label="Navigation Menu"
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo to="/" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors duration-200 min-h-9 min-w-9 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
                {renderNavItems(true)}
              </nav>
              <div className="mt-4 flex flex-col gap-3 border-t border-[#27272A] pt-4">
                <Link
                  to={getSettingsPath(user?.role ?? variant)}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors duration-200 border border-transparent hover:bg-[#141418] hover:border-[#27272A]"
                >
                  <Settings size={15} /> Settings
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pb-20 lg:pb-0">
        <header className="flex items-center justify-between gap-4 border-b border-[#27272A] bg-[#0E0E11]/90 px-4 py-3.5 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              ref={openButtonRef}
              type="button"
              className="min-h-9 min-w-9 rounded-lg border border-[#27272A] p-2 lg:hidden flex items-center justify-center hover:bg-[#141418] text-white transition-colors duration-200"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu size={18} />
            </button>
            {variant === "parent" ? (
              <div className="flex items-center gap-2">
                <Badge variant="purple" size="sm" showDot>
                  Family Workspace
                </Badge>
                <span className="text-xs font-medium text-zinc-400">Parent View</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:inline">
                  Rank
                </span>
                <span className="text-xs font-bold text-indigo-400">{getRankTitle(user?.level ?? 1)}</span>
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
              className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#141418] transition-colors duration-200 min-w-9 min-h-9 flex items-center justify-center border border-transparent hover:border-[#27272A]"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifBadge.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {notifBadge.count > 99 ? "99+" : notifBadge.count}
                </span>
              )}
            </Link>
            {user && (
              <div className="relative border-l border-[#27272A] pl-3" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="flex items-center gap-2 min-h-9 rounded-lg p-1 hover:bg-[#141418] transition-colors duration-200"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  <Avatar
                    src={user.avatarUrl ?? user.avatar}
                    name={user.fullName}
                    userId={user.id}
                    role={user.role === "mentor" ? "mentor" : "student"}
                    size="sm"
                    status="online"
                  />
                  <ChevronDown
                    size={12}
                    className={cn(
                      "text-zinc-500 transition-transform duration-200",
                      accountOpen && "rotate-180",
                    )}
                  />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#27272A] bg-[#0E0E11] shadow-2xl backdrop-blur-xl z-50 py-1">
                    <div className="px-3.5 py-2.5 border-b border-[#27272A]">
                      <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
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
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:bg-[#141418] hover:text-white transition-colors"
                    >
                      <User size={13} /> Profile
                    </Link>
                    <Link
                      to={getSettingsPath(user.role)}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-300 hover:bg-[#141418] hover:text-white transition-colors"
                    >
                      <Settings size={13} /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors border-t border-[#27272A]"
                    >
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 lg:p-8 overflow-y-auto scroll-smooth">
          <Outlet />
        </main>

        {/* Mobile bottom nav with sliding layout indicator */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#27272A] bg-[#0E0E11]/95 pb-[env(safe-area-inset-bottom)] lg:hidden backdrop-blur-md"
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
                  "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] transition-colors duration-200 select-none",
                  isActive ? "text-primary" : "hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-bottom-bar-indicator"
                      className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-primary shadow-[0_1px_8px_rgba(99,102,241,0.6)]"
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
