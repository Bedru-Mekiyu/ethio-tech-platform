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
      <header className="border-b border-zinc-200 bg-white">
        <div className="page-shell flex items-center justify-between gap-3 py-3.5">
          <Logo to="/app/dashboard" />
          <div className="flex items-center gap-3">
            <Badge variant="danger" size="sm" showDot>
              LIVE
            </Badge>
            <span className="text-sm font-semibold tracking-wide text-zinc-900">Virtual Classroom</span>
          </div>
          <Link
            to="/app/dashboard"
            className="flex h-8 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-all"
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
