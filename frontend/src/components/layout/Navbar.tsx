import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, getDashboardPath } from "@/store/authStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export interface NavItem {
  to: string;
  label: string;
}

const MARKETING_NAV_ITEMS: NavItem[] = [
  { to: "/tracks", label: "Tracks" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/mentors", label: "Mentors" },
  { to: "/hubs", label: "Hubs" },
  { to: "/about", label: "About" },
];

export interface NavbarProps {
  className?: string;
  items?: NavItem[];
}

export function Navbar({ className, items = MARKETING_NAV_ITEMS }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const { user } = useAuthStore();

  // Close mobile drawer on route change
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileOpen(false);
  }

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all duration-200 dark:border-white/10 dark:bg-slate-900/95",
        className,
      )}
    >
      <div className="page-shell flex h-14 items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <Logo variant="default" subtitle="East Africa" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150",
                  isActive
                    ? "text-primary font-semibold bg-red-50/50 dark:bg-white/[0.08] dark:text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60",
                )
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA Action Buttons & Theme Switcher */}
        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle size="sm" />
          {user ? (
            <Link to={getDashboardPath(user.role)}>
              <Button size="sm" className="gap-1.5 font-medium">
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors duration-150"
              >
                Sign in
              </Link>
              <Link to="/register">
                <Button size="sm" className="gap-1.5 font-medium">
                  <span>Join EthioTech</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle size="sm" />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-slate-200 bg-white px-5 py-5 md:hidden flex flex-col gap-4 overflow-hidden shadow-lg dark:border-white/10 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* Links */}
            <div className="flex flex-col gap-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150",
                      isActive
                        ? "bg-red-50/50 text-primary font-semibold dark:bg-white/[0.08] dark:text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60",
                    )
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Mobile CTAs */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-4 flex flex-col gap-2.5">
              {user ? (
                <Link to={getDashboardPath(user.role)} onClick={() => setMobileOpen(false)}>
                  <Button className="w-full justify-center gap-2 py-2">
                    <LayoutDashboard size={15} />
                    <span>Go to Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full justify-center gap-2 py-2">
                      <span>Join EthioTech</span>
                      <ArrowRight size={15} />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
