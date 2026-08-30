import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NavItem {
  to: string;
  label: string;
}

export const MARKETING_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/tracks", label: "Tracks" },
  { to: "/how-it-works", label: "Programs" },
  { to: "/mentors", label: "Mentors" },
  { to: "/hubs", label: "Hubs" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/community", label: "Community" },
  { to: "/about", label: "About" },
];

export interface NavbarProps {
  className?: string;
  items?: NavItem[];
}

export function Navbar({ className, items = MARKETING_NAV_ITEMS }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
        "sticky top-0 z-50 w-full border-b border-[#1E293B] bg-[#090D16]/90 backdrop-blur-xl transition-all duration-200",
        className
      )}
    >
      <div className="page-shell flex h-16 items-center justify-between">
        {/* Brand Logo & PISTELS Mission Badge */}
        <div className="flex items-center gap-4">
          <Logo variant="default" subtitle="East Africa" />
          
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#1E293B] bg-[#0F172A]/80 px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
            <Sparkles size={11} className="text-primary" />
            <span className="tracking-wide">PISTELS Framework</span>
          </div>
        </div>

        {/* Desktop Navigation Links with Active Indicator */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150",
                  isActive
                    ? "text-white font-semibold"
                    : "text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-marketing-tab"
                      className="absolute inset-0 rounded-lg bg-[#1E293B]/70 border border-[#334155]/60"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link to="/register">
            <Button size="sm" className="gap-1.5">
              <span>Join EthioTech</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[#1E293B] bg-[#0F172A] text-white hover:bg-[#1E293B] hover:border-[#334155] transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[#1E293B] bg-[#090D16]/98 px-5 py-6 md:hidden flex flex-col gap-5 overflow-hidden shadow-2xl backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            {/* PISTELS Banner inside Mobile Drawer */}
            <div className="flex items-center gap-2 rounded-xl border border-[#1E293B] bg-[#0F172A] p-3 text-xs text-[var(--text-secondary)]">
              <Sparkles size={16} className="text-primary shrink-0" />
              <span className="font-medium">
                PISTELS: Problem-solving · Innovation · Science · Tech · Engineering · Leadership · Skills
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 text-base font-medium rounded-lg transition-colors duration-150",
                      isActive
                        ? "bg-[#1E293B] text-white font-semibold border border-[#334155]"
                        : "text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.04]"
                    )
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Mobile CTAs */}
            <div className="border-t border-[#1E293B] pt-4 flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full justify-center gap-2 py-2.5">
                  <span>Join EthioTech</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
