import { useState, useEffect } from "react";
import { Grid, Maximize, Minimize, Radio, Users, Sparkles, CircleDot } from "lucide-react";

interface LiveKitHeaderProps {
  title: string;
  mentorName?: string;
  liveStartedAt?: string | null;
  participantCount?: number;
  isRecording?: boolean;
  layout: "grid" | "speaker";
  onChangeLayout: (layout: "grid" | "speaker") => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function LiveKitHeader({
  title,
  mentorName,
  liveStartedAt,
  participantCount = 1,
  isRecording = false,
  layout,
  onChangeLayout,
  onToggleFullscreen,
  isFullscreen = false,
}: LiveKitHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");

  useEffect(() => {
    const startTime = liveStartedAt ? new Date(liveStartedAt).getTime() : Date.now();

    const updateTimer = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - startTime) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      if (hours > 0) {
        setElapsedTime(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      } else {
        setElapsedTime(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [liveStartedAt]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0B0F19]/90 px-4 md:px-6 backdrop-blur-xl z-20 select-none">
      {/* Left: Title & Live Badge */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-400">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="tracking-wider uppercase text-[10px]">Live</span>
        </div>

        <div className="min-w-0">
          <h1 className="text-sm md:text-base font-semibold text-white truncate max-w-[200px] sm:max-w-[320px] md:max-w-[480px]">
            {title || "Live Classroom Session"}
          </h1>
          {mentorName && (
            <p className="text-[11px] text-slate-400 truncate">
              Hosted by <span className="text-slate-300 font-medium">{mentorName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Center: Live Elapsed Timer & Recording Badge */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-white/5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300">
          <Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
          <span>{elapsedTime}</span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400">
            <CircleDot className="h-3.5 w-3.5 animate-spin text-rose-400" />
            <span>REC</span>
          </div>
        )}
      </div>

      {/* Right: Controls, Layout Switcher & Participant count */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Participant Count */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 border border-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
          <Users className="h-3.5 w-3.5 text-violet-400" />
          <span>{participantCount}</span>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center rounded-xl bg-slate-900/80 border border-white/5 p-1">
          <button
            type="button"
            onClick={() => onChangeLayout("grid")}
            className={`rounded-lg p-1.5 transition-colors ${
              layout === "grid" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChangeLayout("speaker")}
            className={`rounded-lg p-1.5 transition-colors ${
              layout === "speaker" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Speaker / Spotlight View"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hidden md:flex rounded-xl bg-slate-900/80 border border-white/5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        )}
      </div>
    </header>
  );
}
