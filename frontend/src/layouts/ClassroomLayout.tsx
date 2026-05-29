import { Outlet, Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { MessageSquare, PhoneOff, Signal, Users, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ClassroomLayout() {
  const scrollToSection = (sectionId: string) => {
    if (typeof document === "undefined") return;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top,rgba(0,210,255,0.06),rgba(5,10,20,1)_45%)]">
      <a
        href="#classroom-main"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-[var(--bg-base)] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to classroom
      </a>
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[rgba(5,10,20,0.68)] px-4 py-3.5 backdrop-blur-xl lg:px-6">
        <Logo to="/app/dashboard" />
        <div className="flex items-center gap-3">
          <Badge variant="danger" size="sm" showDot className="animate-pulse shadow-[0_0_8px_rgba(255,75,92,0.4)]">
            LIVE
          </Badge>
          <span className="text-sm font-semibold tracking-wide text-white">Virtual Classroom</span>
        </div>
        <span
          className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)] shadow-sm backdrop-blur-sm select-none"
          aria-live="polite"
        >
          Presence sync active
        </span>
      </header>
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Control Bar */}
        <aside className="hidden w-16 flex-col items-center gap-6 border-r border-[var(--border)] bg-[rgba(11,14,20,0.84)] py-6 md:flex">
          <Link
            to="/app/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/3 text-[var(--text-secondary)] hover:bg-white/8 hover:text-white transition-all duration-200 hover:scale-105 active:scale-[0.98]"
            aria-label="Back to dashboard"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
        </aside>
        
        {/* Workspace */}
        <div className="relative flex-1" id="classroom-main">
          <Outlet />
          
          {/* Immersive Toolbar */}
          <div
            className="absolute bottom-4 left-1/2 flex w-[calc(100%-1.5rem)] max-w-4xl -translate-x-1/2 flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-[rgba(11,14,20,0.92)] px-5 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.65),0_0_32px_rgba(0,210,255,0.03)] backdrop-blur-xl md:bottom-6 md:w-[calc(100%-3rem)]"
            role="toolbar"
            aria-label="Classroom collaboration tools"
          >
            <div className="min-w-[240px] flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Collaboration Hub</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                Chat, presence, and lightweight sync are active for this sandbox workspace.
              </p>
              <Badge variant="warning" size="sm" className="mt-2.5">
                Video sync rolling out soon
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs font-semibold"
                onClick={() => scrollToSection("classroom-activity")}
              >
                <Users size={15} /> Room
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs font-semibold"
                onClick={() => scrollToSection("classroom-chat")}
              >
                <MessageSquare size={15} /> Chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs font-semibold"
                onClick={() => scrollToSection("classroom-scene")}
              >
                <Signal size={15} /> Focus
              </Button>
              
              <Link to="/app/dashboard" className="ml-2">
                <Button variant="danger" size="sm" className="text-xs font-semibold shadow-sm" aria-label="Leave classroom">
                  <PhoneOff size={15} className="mr-0.5" /> Leave
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

