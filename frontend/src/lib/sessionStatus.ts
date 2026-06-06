import type { MeetingStatus } from "@/lib/realtime";

export type SessionStatus =
  | "draft"
  | "scheduled"
  | "registration_closed"
  | "live"
  | "paused"
  | "ended"
  | "canceled"
  | "rescheduled";

export const SESSION_STATUSES: readonly SessionStatus[] = [
  "draft",
  "scheduled",
  "registration_closed",
  "live",
  "paused",
  "ended",
  "canceled",
  "rescheduled",
] as const;

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  registration_closed: "Registration closed",
  live: "Live",
  paused: "Paused",
  ended: "Ended",
  canceled: "Canceled",
  rescheduled: "Rescheduled",
};

export const SESSION_STATUS_TONES: Record<SessionStatus, "info" | "warning" | "success" | "muted" | "danger"> = {
  draft: "muted",
  scheduled: "info",
  registration_closed: "warning",
  live: "success",
  paused: "warning",
  ended: "muted",
  canceled: "danger",
  rescheduled: "info",
};

export function toMeetingStatus(sessionStatus: SessionStatus | string | null | undefined): MeetingStatus {
  switch (sessionStatus) {
    case "live":
    case "paused":
      return "active";
    case "ended":
      return "completed";
    case "canceled":
      return "cancelled";
    case "draft":
    case "scheduled":
    case "rescheduled":
      return "scheduled";
    case "registration_closed":
      return "waiting_for_host";
    default:
      return "scheduled";
  }
}

export function isLiveStatus(sessionStatus: SessionStatus | string | null | undefined): boolean {
  return sessionStatus === "live" || sessionStatus === "paused";
}

export function isTerminalStatus(sessionStatus: SessionStatus | string | null | undefined): boolean {
  return sessionStatus === "ended" || sessionStatus === "canceled";
}

export function isRescheduleableStatus(sessionStatus: SessionStatus | string | null | undefined): boolean {
  return sessionStatus === "scheduled" || sessionStatus === "rescheduled";
}

export function isPausableStatus(sessionStatus: SessionStatus | string | null | undefined): boolean {
  return sessionStatus === "live";
}

export function isResumableStatus(sessionStatus: SessionStatus | string | null | undefined): boolean {
  return sessionStatus === "paused";
}

export function canCloseRegistration(sessionStatus: SessionStatus | string | null | undefined): boolean {
  return sessionStatus === "scheduled";
}

export function canReopenRegistration(sessionStatus: SessionStatus | string | null | undefined): boolean {
  return sessionStatus === "registration_closed";
}
