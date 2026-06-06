import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Clock, Radio, Video, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { MeetingStatus, MeetingViewModel } from "@/lib/realtime";
import { formatCountdown, formatDateTime } from "@/features/meetings/meetingStatus";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BANNER_META: Record<
  MeetingStatus,
  {
    title: string;
    description: string;
    icon: LucideIcon;
    tone: "info" | "warning" | "success" | "muted" | "danger";
  }
> = {
  scheduled: {
    title: "Meeting has not started yet",
    description:
      "The room will open when your mentor is ready. You can wait here or come back closer to the start time.",
    icon: CalendarClock,
    tone: "info",
  },
  waiting_for_host: {
    title: "Waiting for mentor to start the session",
    description: "The mentor hasn't joined yet. We'll bring you in as soon as the room is live.",
    icon: Clock,
    tone: "warning",
  },
  active: {
    title: "Live session in progress",
    description: "You can join or rejoin the room at any time while the meeting is active.",
    icon: Radio,
    tone: "success",
  },
  completed: {
    title: "This meeting has ended",
    description: "Rejoin is disabled. Look for recordings, notes, or feedback from your mentor.",
    icon: CheckCircle2,
    tone: "muted",
  },
  cancelled: {
    title: "This meeting was cancelled",
    description: "The mentor or admin cancelled this session. The room is no longer available.",
    icon: XCircle,
    tone: "danger",
  },
};

const TONE_STYLES: Record<
  keyof (typeof BANNER_META)["scheduled"]["tone"] extends never
    ? never
    : "info" | "warning" | "success" | "muted" | "danger",
  string
> = {
  info: "border-primary/25 bg-primary/8 text-primary",
  warning: "border-warning/30 bg-warning/8 text-warning",
  success: "border-success/30 bg-success/8 text-success",
  muted: "border-white/10 bg-white/3 text-[var(--text-muted)]",
  danger: "border-danger/30 bg-danger/8 text-danger",
};

export interface MeetingStatusBannerProps {
  status: MeetingStatus;
  meeting?: MeetingViewModel | null;
  className?: string;
  joinHref?: string | null;
  joinable?: boolean;
  startsInMs?: number | null;
  scheduledAt?: string | null;
}

export function MeetingStatusBanner({
  status,
  meeting,
  className,
  joinHref,
  joinable,
  startsInMs,
  scheduledAt,
}: MeetingStatusBannerProps) {
  const meta = BANNER_META[status] ?? BANNER_META.scheduled;
  const Icon = meta.icon;
  const toneKey = meta.tone;
  const toneClass = TONE_STYLES[toneKey];

  const resolvedJoinHref = joinHref ?? meeting?.joinHref ?? null;
  const resolvedJoinable = joinable ?? meeting?.joinable ?? false;
  const resolvedStartsIn = startsInMs ?? meeting?.startsInMs ?? null;
  const resolvedScheduled = scheduledAt ?? meeting?.scheduledAt ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
      data-meeting-banner="true"
      data-meeting-status={status}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 shadow-sm md:flex-row md:items-center md:justify-between",
        toneClass,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/30 bg-black/15">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight">{meta.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-current/80">{meta.description}</p>
          {resolvedScheduled ? (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-current/70">
              {formatDateTime(resolvedScheduled)}
              {resolvedStartsIn != null && resolvedStartsIn > 0
                ? ` · Starts in ${formatCountdown(resolvedStartsIn)}`
                : null}
            </p>
          ) : null}
        </div>
      </div>
      {resolvedJoinable && resolvedJoinHref ? (
        <Link to={resolvedJoinHref}>
          <Button size="sm" variant="primary" className="font-semibold shadow-sm" data-testid="meeting-banner-join">
            <Video size={14} /> {status === "active" ? "Join live now" : "Open meeting room"}
          </Button>
        </Link>
      ) : null}
    </motion.div>
  );
}
