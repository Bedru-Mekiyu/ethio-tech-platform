import { Outlet, Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { MessageSquare, PhoneOff, Signal, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ClassroomLayout() {
  const scrollToSection = (sectionId: string) => {
    if (typeof document === "undefined") return;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.08),rgba(5,10,20,1)_36%)]">
      <a
        href="#classroom-main"
        className="sr-only rounded-md bg-primary px-4 py-2 text-sm font-medium text-[var(--bg-base)] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to classroom
      </a>
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[rgba(5,10,20,0.68)] px-4 py-3 backdrop-blur-xl">
        <Logo to="/app/dashboard" />
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-danger/30 bg-danger/15 px-2.5 py-0.5 text-xs font-bold text-danger">
            LIVE
          </span>
          <span className="text-sm text-[var(--text-secondary)]">Virtual Classroom</span>
        </div>
        <span
          className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)]"
          aria-live="polite"
        >
          Presence sync active
        </span>
      </header>
      <div className="relative flex flex-1 overflow-hidden">
        <aside className="hidden w-14 flex-col items-center gap-4 border-r border-[var(--border)] bg-[rgba(11,14,20,0.84)] py-4 md:flex">
          <Link to="/app/dashboard" className="text-[var(--text-muted)] hover:text-primary" aria-label="Back to dashboard">
            ←
          </Link>
        </aside>
        <div className="relative flex-1" id="classroom-main">
          <Outlet />
          <div
            className="absolute bottom-4 left-1/2 flex w-[calc(100%-1rem)] max-w-4xl -translate-x-1/2 flex-wrap items-center gap-3 rounded-3xl border border-[var(--border)] bg-[rgba(11,14,20,0.92)] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl md:bottom-6 md:w-[calc(100%-2rem)]"
            role="toolbar"
            aria-label="Classroom collaboration tools"
          >
            <div className="min-w-[220px] flex-1">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Collaboration tools</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Chat, presence, and low-bandwidth sync are active for this room.
              </p>
              <Badge variant="warning" className="mt-2">
                Audio/video streaming is rolling out
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => scrollToSection("classroom-activity")}>
                <Users size={16} /> Room activity
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => scrollToSection("classroom-chat")}>
                <MessageSquare size={16} /> Live chat
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => scrollToSection("classroom-scene")}>
                <Signal size={16} /> Focus view
              </Button>
            </div>
            <Link to="/app/dashboard">
              <Button variant="danger" size="sm" aria-label="Leave classroom">
                <PhoneOff size={16} /> Leave
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
