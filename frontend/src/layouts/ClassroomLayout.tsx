import { Outlet, Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ClassroomLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)]">
      <a
        href="#classroom-main"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-[var(--bg-base)] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to classroom
      </a>
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="page-shell flex items-center justify-between gap-3 py-3.5">
          <Logo to="/app/dashboard" />
          <div className="flex items-center gap-3">
            <Badge variant="danger" size="sm" showDot className="animate-pulse shadow-[0_0_8px_rgba(255,75,92,0.4)]">
              LIVE
            </Badge>
            <span className="text-sm font-semibold tracking-wide text-white">Virtual Classroom</span>
          </div>
          <Link
            to="/app/dashboard"
            className="flex h-8 items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-white/8 hover:text-white transition-all"
          >
            <ArrowLeft size={14} />
            Leave
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-hidden" id="classroom-main">
        <Outlet />
      </main>
    </div>
  );
}
