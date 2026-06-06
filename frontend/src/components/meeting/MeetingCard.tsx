import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Circle, Clock, Play, Radio, Shield, Users, Video, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MeetingStatus, MeetingViewModel } from "@/lib/realtime";
import { formatCountdown, formatDateTime } from "@/features/meetings/meetingStatus";

const STATUS_META: Record<
  MeetingStatus,
  {
    label: string;
    badge: "default" | "success" | "warning" | "purple" | "danger";
    icon: LucideIcon;
    description: string;
  }
> = {
  scheduled: {
    label: "Scheduled",
    badge: "default",
    icon: CalendarClock,
    description: "Meeting has not started yet",
  },
  waiting_for_host: {
    label: "Waiting for host",
    badge: "warning",
    icon: Clock,
    description: "Waiting for mentor to start the session",
  },
  active: {
    label: "Live now",
    badge: "success",
    icon: Radio,
    description: "Session is in progress",
  },
  completed: {
    label: "Ended",
    badge: "default",
    icon: CheckCircle2,
    description: "Meeting has ended",
  },
  cancelled: {
    label: "Cancelled",
    badge: "danger",
    icon: XCircle,
    description: "Meeting was cancelled",
  },
};

export interface MeetingCardProps {
  meeting: MeetingViewModel;
  variant?: "full" | "compact" | "inline";
  className?: string;
  onStart?: (meeting: MeetingViewModel) => void;
  onEnd?: (meeting: MeetingViewModel) => void;
  onCancel?: (meeting: MeetingViewModel) => void;
  startLoading?: boolean;
  endLoading?: boolean;
}

function CounterpartyLabel({ meeting }: { meeting: MeetingViewModel }) {
  const isMentorContext = meeting.isHost;
  if (isMentorContext) {
    const ids = meeting.participantIds ?? (meeting.studentId ? [meeting.studentId] : []);
    return (
      <span className="truncate">
        {ids.length > 1 ? `${ids.length} students` : meeting.studentName?.trim() || "Student"}
      </span>
    );
  }
  return <span className="truncate">{meeting.mentorName?.trim() || "Mentor"}</span>;
}

function StatusHelper({ meeting }: { meeting: MeetingViewModel }) {
  if (meeting.status === "scheduled") {
    return meeting.startsInMs != null && meeting.startsInMs > 0 ? (
      <span>Starts in {formatCountdown(meeting.startsInMs)}</span>
    ) : (
      <span>Meeting has not started yet</span>
    );
  }
  if (meeting.status === "waiting_for_host") {
    return <span>Waiting for mentor to start the session</span>;
  }
  if (meeting.status === "active") {
    return <span>Session is in progress · {meeting.presenceCount} in room</span>;
  }
  if (meeting.status === "completed") {
    return <span>Meeting has ended</span>;
  }
  return <span>Meeting was cancelled{meeting.cancelReason ? ` · ${meeting.cancelReason}` : ""}</span>;
}

export function MeetingCard({
  meeting,
  variant = "full",
  className,
  onStart,
  onEnd,
  onCancel,
  startLoading = false,
  endLoading = false,
}: MeetingCardProps) {
  const meta = STATUS_META[meeting.status] ?? STATUS_META.scheduled;
  const Icon = meta.icon;

  const isFull = variant === "full";
  const isCompact = variant === "compact";
  const isInline = variant === "inline";

  const canStart =
    meeting.isHost && meeting.status !== "active" && meeting.status !== "completed" && meeting.status !== "cancelled";
  const canEnd = meeting.isHost && meeting.status === "active";
  const canCancel = meeting.isHost && (meeting.status === "scheduled" || meeting.status === "waiting_for_host");
  const canJoin = meeting.joinable;

  const isDisabled = meeting.status === "cancelled" || meeting.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-white/3 p-4 transition-all duration-200",
        isFull && "md:p-5",
        isInline && "p-3",
        meeting.status === "active" && "border-success/30 bg-success/5",
        meeting.status === "waiting_for_host" && "border-warning/30 bg-warning/5",
        meeting.status === "cancelled" && "border-danger/20 opacity-90",
        className,
      )}
      data-meeting-card="true"
      data-meeting-id={meeting.id || meeting.sessionId}
      data-meeting-status={meeting.status}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            meeting.status === "active" && "bg-success/10 border-success/30 text-success",
            meeting.status === "waiting_for_host" && "bg-warning/10 border-warning/30 text-warning",
            meeting.status === "cancelled" && "bg-danger/10 border-danger/30 text-danger",
            (meeting.status === "scheduled" || meeting.status === "completed") &&
              "bg-primary/10 border-primary/20 text-primary",
          )}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.badge} size="sm" showDot={meeting.status === "active"}>
              {meta.label}
            </Badge>
            {meeting.presenceCount > 0 && meeting.status === "active" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                <Users size={11} /> {meeting.presenceCount}
              </span>
            ) : null}
            {!isCompact ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-medium">
                <Clock size={11} /> {formatDateTime(meeting.scheduledAt)}
              </span>
            ) : null}
          </div>

          <h3 className={cn("mt-2 font-bold text-white tracking-tight", isInline ? "text-sm" : "text-base")}>
            {meeting.title || "Live session"}
          </h3>

          {!isCompact ? (
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
              With <CounterpartyLabel meeting={meeting} />
              {meeting.durationMinutes ? ` · ${meeting.durationMinutes} min` : ""}
            </p>
          ) : null}

          <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">
            <StatusHelper meeting={meeting} />
          </p>

          {isFull ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {canJoin ? (
                meeting.status === "active" ? (
                  <Link to={meeting.joinHref}>
                    <Button size="sm" className="font-semibold shadow-sm" data-testid="meeting-join">
                      <Video size={14} /> Join live session
                    </Button>
                  </Link>
                ) : (
                  <Link to={meeting.joinHref}>
                    <Button size="sm" variant="outline" className="font-semibold" data-testid="meeting-open">
                      Open meeting room
                    </Button>
                  </Link>
                )
              ) : null}
              {canStart ? (
                <Button
                  size="sm"
                  variant="primary"
                  className="font-semibold shadow-sm"
                  onClick={() => onStart?.(meeting)}
                  loading={startLoading}
                  data-testid="meeting-start"
                >
                  <Play size={14} /> Start session
                </Button>
              ) : null}
              {canEnd ? (
                <Button
                  size="sm"
                  variant="danger"
                  className="font-semibold shadow-sm"
                  onClick={() => onEnd?.(meeting)}
                  loading={endLoading}
                  data-testid="meeting-end"
                >
                  End session
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="font-semibold text-[var(--text-muted)]"
                  onClick={() => onCancel?.(meeting)}
                  data-testid="meeting-cancel"
                >
                  <Shield size={14} /> Cancel
                </Button>
              ) : null}
              {isDisabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white/3 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
                  <Circle size={10} /> Unavailable
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isCompact ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canJoin ? (
            <Link to={meeting.joinHref}>
              <Button size="sm" variant={meeting.status === "active" ? "primary" : "outline"} className="font-semibold">
                {meeting.status === "active" ? "Join now" : "Open"}
              </Button>
            </Link>
          ) : null}
          {canStart ? (
            <Button size="sm" onClick={() => onStart?.(meeting)} loading={startLoading} className="font-semibold">
              Start
            </Button>
          ) : null}
          {canEnd ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onEnd?.(meeting)}
              loading={endLoading}
              className="font-semibold"
            >
              End
            </Button>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}
