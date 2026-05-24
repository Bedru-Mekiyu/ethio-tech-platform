import { Outlet, Link, NavLink } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "Programs" },
  { to: "/hubs", label: "Hubs" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/about", label: "About" },
];

export function MarketingLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm text-[var(--text-secondary)] transition hover:text-white",
                    isActive && "text-primary"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="text-sm text-[var(--text-secondary)] hover:text-white">
              Sign in
            </Link>
            <Link to="/register">
              <Button>Join EthioTech</Button>
            </Link>
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-[var(--border)] px-4 py-4 md:hidden">
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className="block py-2" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link to="/login" className="block py-2" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <Button className="mt-2 w-full">Join EthioTech</Button>
            </Link>
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-20 border-t border-[var(--border)] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-[var(--text-muted)] md:flex-row lg:px-8">
          <Logo />
          <div className="flex gap-6">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <p>© {new Date().getFullYear()} EthioTech. Empowering African innovators.</p>
        </div>
      </footer>
    </div>
  );
}
