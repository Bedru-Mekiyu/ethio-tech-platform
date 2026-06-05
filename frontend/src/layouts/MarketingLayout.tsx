import { useEffect, useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, Github, Twitter, Linkedin, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "Programs" },
  { to: "/mentors", label: "Mentors" },
  { to: "/hubs", label: "Hubs" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/about", label: "About" },
];

export function MarketingLayout() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(5,10,20,0.8)] backdrop-blur-xl transition-colors duration-200">
        <div className="page-shell flex items-center justify-between py-4.5">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative py-1 text-sm font-medium transition-colors duration-200",
                    isActive ? "text-primary" : "text-[var(--text-secondary)] hover:text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="active-marketing-tab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary shadow-[0_1px_8px_rgba(0,210,255,0.6)]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link to="/register">
              <Button size="md">Join EthioTech</Button>
            </Link>
          </div>
          <button
            type="button"
            className="md:hidden p-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-white transition-colors duration-200"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-marketing-nav"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-marketing-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="border-t border-[var(--border)] bg-[rgba(8,14,24,0.98)] px-5 py-6 md:hidden flex flex-col gap-4 overflow-hidden shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-base font-medium text-[var(--text-secondary)] hover:text-white py-1.5 transition-colors duration-200"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-[var(--border)] pt-4 mt-2 flex flex-col gap-4">
                <Link
                  to="/login"
                  className="text-base font-medium text-[var(--text-secondary)] hover:text-white py-1.5 transition-colors duration-200"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}>
                  <Button className="w-full">Join EthioTech</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--border)] bg-[rgba(5,10,20,0.85)] py-16 backdrop-blur-md">
        <div className="page-shell grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              A learning platform for Ethiopian students, with live classrooms, mentors, and project-based tracks.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-[var(--text-muted)] hover:text-primary transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="#"
                className="text-[var(--text-muted)] hover:text-primary transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="text-[var(--text-muted)] hover:text-primary transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="text-[var(--text-muted)] hover:text-primary transition-colors duration-200"
                aria-label="Website"
              >
                <Globe size={18} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4.5">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-[var(--text-muted)] hover:text-white transition-colors duration-200"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  to="/mentors"
                  className="text-[var(--text-muted)] hover:text-white transition-colors duration-200"
                >
                  Mentors
                </Link>
              </li>
              <li>
                <Link to="/hubs" className="text-[var(--text-muted)] hover:text-white transition-colors duration-200">
                  Hubs
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-[var(--text-muted)] hover:text-white transition-colors duration-200"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4.5">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-[var(--text-muted)] hover:text-white transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[var(--text-muted)] hover:text-white transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="text-[var(--text-muted)] hover:text-white transition-colors duration-200">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4.5">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="text-[var(--text-muted)] hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[var(--text-muted)] hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="page-shell mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-xs text-[var(--text-muted)] md:flex-row">
          <p>© {new Date().getFullYear()} EthioTech.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-danger">♥</span> for East Africa
          </p>
        </div>
      </footer>
    </div>
  );
}
