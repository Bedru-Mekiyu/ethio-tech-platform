import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        "sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#050507]/70 backdrop-blur-xl transition-all duration-200",
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
                    ? "text-white font-medium bg-white/[0.06]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]",
                )
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-150"
          >
            Sign in
          </Link>
          <Link to="/register">
            <Button size="sm" className="gap-1.5 font-medium">
              <span>Join EthioTech</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[#27272A] bg-[#0E0E11] text-zinc-300 hover:bg-[#18181B] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
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
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[#27272A] bg-[#050507]/98 px-5 py-5 md:hidden flex flex-col gap-4 overflow-hidden shadow-2xl backdrop-blur-2xl"
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
                        ? "bg-[#18181B] text-white font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]",
                    )
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Mobile CTAs */}
            <div className="border-t border-[#27272A] pt-4 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="w-full text-center py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
