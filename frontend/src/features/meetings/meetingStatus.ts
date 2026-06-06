import type { MeetingStatus, MeetingViewModel } from "@/lib/realtime";

export type SessionLike = {
  _id: string;
  status: string;
  scheduledAt: string;
  liveStartedAt?: string | null;
  liveEndedAt?: string | null;
  durationMinutes?: number;
  hostJoined?: boolean;
  presenceCount?: number;
};

const deriveStatus = (input: SessionLike, now: number): MeetingStatus => {
  const scheduledMs = input.scheduledAt ? new Date(input.scheduledAt).getTime() : NaN;
  const durationMs = (input.durationMinutes ?? 60) * 60 * 1000;

  if (input.status === "canceled") return "cancelled";
  if (input.status === "ended") return "completed";
  if (input.status === "live" || input.status === "paused") return "active";

  if (Number.isFinite(scheduledMs) && now >= scheduledMs + durationMs) {
    return "completed";
  }

  const isOpen =
    input.status === "scheduled" ||
    input.status === "registration_closed" ||
    input.status === "rescheduled" ||
    input.status === "draft";

  if (isOpen) {
    if (Number.isFinite(scheduledMs) && now >= scheduledMs) {
      return input.hostJoined ? "active" : "waiting_for_host";
    }
    return "scheduled";
  }

  if (input.hostJoined) return "active";
  return "scheduled";
};

export const computeMeetingStatus = (input: SessionLike, now: number = Date.now()): MeetingStatus =>
  deriveStatus(input, now);

const computeStartsInMs = (scheduledAt: string | Date | undefined, now: number): number | null => {
  if (!scheduledAt) return null;
  return Math.max(0, new Date(scheduledAt).getTime() - now);
};

const computeEndsAt = (input: SessionLike): string | null => {
  if (input.liveEndedAt) return new Date(input.liveEndedAt).toISOString();
  if (input.liveStartedAt) {
    return new Date(new Date(input.liveStartedAt).getTime() + (input.durationMinutes ?? 60) * 60 * 1000).toISOString();
  }
  if (input.scheduledAt) {
    return new Date(new Date(input.scheduledAt).getTime() + (input.durationMinutes ?? 60) * 60 * 1000).toISOString();
  }
  return null;
};

export const enrichMeeting = (meeting: MeetingViewModel, now: number = Date.now()): MeetingViewModel => {
  const status = computeMeetingStatus(
    {
      _id: meeting.id || meeting.sessionId,
      status: meeting.status as unknown as string,
      scheduledAt: meeting.scheduledAt,
      liveStartedAt: meeting.liveStartedAt,
      liveEndedAt: meeting.liveEndedAt,
      durationMinutes: meeting.durationMinutes,
      hostJoined: meeting.hostJoined,
    },
    now,
  );
  return {
    ...meeting,
    status,
    startsInMs: computeStartsInMs(meeting.scheduledAt, now),
    endsAt:
      meeting.endsAt ??
      computeEndsAt({
        _id: meeting.id,
        status: meeting.status,
        scheduledAt: meeting.scheduledAt,
        liveStartedAt: meeting.liveStartedAt,
        liveEndedAt: meeting.liveEndedAt,
        durationMinutes: meeting.durationMinutes,
      }),
  };
};

export const formatCountdown = (ms: number | null | undefined): string => {
  if (ms == null) return "";
  if (ms <= 0) return "starting now";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes} min`;
  return `${Math.max(1, totalSeconds)}s`;
};

export const formatTime = (iso: string | Date | null | undefined): string => {
  if (!iso) return "";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const formatDate = (iso: string | Date | null | undefined): string => {
  if (!iso) return "";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export const formatDateTime = (iso: string | Date | null | undefined): string => {
  if (!iso) return "";
  return `${formatDate(iso)} · ${formatTime(iso)}`;
};
