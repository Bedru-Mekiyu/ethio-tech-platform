import { Clock, Users, Radio } from "lucide-react";

interface MeetingHeaderProps {
  title: string;
  status: string;
  liveStartedAt?: string;
  participantCount: number;
  isRecording?: boolean;
}

function formatDuration(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MeetingHeader({ title, status, liveStartedAt, participantCount, isRecording }: MeetingHeaderProps) {
  const isLive = status === "live";

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border-b border-white/5">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white truncate max-w-xs">{title}</h1>
        {isLive && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
            <Radio size={10} className="animate-pulse" />
            Live
          </span>
        )}
        {isRecording && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            REC
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        {liveStartedAt && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {formatDuration(liveStartedAt)}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          {participantCount}
        </span>
      </div>
    </div>
  );
}
