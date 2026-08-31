import { api, type ApiResponse } from "./api";

export type CalendarEventType =
  | "session"
  | "deadline"
  | "milestone"
  | "study_block"
  | "hub_visit"
  | "custom"
  | "office_hours";

export type CalendarEventStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface CalendarEvent {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  status?: CalendarEventStatus;
  start: string;
  end: string;
  startAt?: string;
  endAt?: string;
  allDay: boolean;
  isAllDay?: boolean;
  sessionId?: string;
  relatedSession?: { _id: string; title: string; scheduledAt: string; status: string } | string;
  trackId?: string;
  targetTrack?: string;
  capstoneProject?: string;
  assignmentId?: string;
  relatedAssignment?: { _id: string; title: string; dueDate?: string } | string;
  color?: string;
  location?: string;
  url?: string;
  reminder?: { enabled: boolean; minutesBefore: number };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCalendarEventPayload {
  title: string;
  description?: string;
  type: CalendarEventType;
  status?: CalendarEventStatus;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  targetTrack?: string;
  capstoneProject?: string;
  sessionId?: string;
  trackId?: string;
  assignmentId?: string;
  location?: string;
  url?: string;
  reminder?: { enabled: boolean; minutesBefore: number };
}

export type UpdateCalendarEventPayload = Partial<CreateCalendarEventPayload> & {
  status?: CalendarEventStatus;
};

export interface CalendarFilterParams {
  start?: string;
  end?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  trackId?: string;
  status?: string;
}

export const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; text: string; border: string; hex: string }> = {
  study_block: { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30", hex: "#6366F1" },
  session: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", hex: "#3B82F6" },
  deadline: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", hex: "#EF4444" },
  milestone: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", hex: "#10B981" },
  hub_visit: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", hex: "#F59E0B" },
  office_hours: { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", hex: "#06B6D4" },
  custom: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30", hex: "#8B5CF6" },
};

function normalizeEvent(event: Record<string, unknown>): CalendarEvent {
  const start =
    (typeof event.start === "string" ? event.start : undefined) ||
    (typeof event.startAt === "string" ? event.startAt : undefined) ||
    new Date().toISOString();
  const end =
    (typeof event.end === "string" ? event.end : undefined) ||
    (typeof event.endAt === "string" ? event.endAt : undefined) ||
    start;
  const allDay = Boolean(event.allDay ?? event.isAllDay ?? false);
  const rawType = (event.type || "custom") as CalendarEventType;
  const rawStatus = (event.status || "pending") as CalendarEventStatus;
  const id = String(event._id || event.id || Math.random());

  let sessionId: string | undefined = undefined;
  if (event.sessionId) {
    sessionId =
      typeof event.sessionId === "object" && event.sessionId !== null
        ? String((event.sessionId as { _id?: unknown })._id || "")
        : String(event.sessionId);
  } else if (event.relatedSession) {
    sessionId =
      typeof event.relatedSession === "object" && event.relatedSession !== null
        ? String((event.relatedSession as { _id?: unknown })._id || "")
        : String(event.relatedSession);
  }

  let assignmentId: string | undefined = undefined;
  if (event.assignmentId) {
    assignmentId =
      typeof event.assignmentId === "object" && event.assignmentId !== null
        ? String((event.assignmentId as { _id?: unknown })._id || "")
        : String(event.assignmentId);
  } else if (event.relatedAssignment) {
    assignmentId =
      typeof event.relatedAssignment === "object" && event.relatedAssignment !== null
        ? String((event.relatedAssignment as { _id?: unknown })._id || "")
        : String(event.relatedAssignment);
  }

  const defaultColor = EVENT_TYPE_COLORS[rawType]?.hex ?? "#6366F1";

  return {
    _id: id,
    id,
    title: String(event.title || "Untitled Event"),
    description: String(event.description || ""),
    type: rawType,
    status: rawStatus,
    start: typeof start === "string" ? start : new Date(start).toISOString(),
    end: typeof end === "string" ? end : new Date(end).toISOString(),
    allDay,
    isAllDay: allDay,
    color: String(event.color || defaultColor),
    targetTrack: typeof event.targetTrack === "string" ? event.targetTrack : undefined,
    capstoneProject: typeof event.capstoneProject === "string" ? event.capstoneProject : undefined,
    trackId: typeof event.trackId === "string" ? event.trackId : undefined,
    sessionId,
    relatedSession: event.relatedSession as CalendarEvent["relatedSession"],
    assignmentId,
    relatedAssignment: event.relatedAssignment as CalendarEvent["relatedAssignment"],
    location: typeof event.location === "string" ? event.location : undefined,
    url: typeof event.url === "string" ? event.url : undefined,
    reminder:
      typeof event.reminder === "object" && event.reminder !== null
        ? (event.reminder as { enabled: boolean; minutesBefore: number })
        : typeof event.reminder === "number"
          ? { enabled: true, minutesBefore: event.reminder }
          : undefined,
    createdBy: typeof event.createdBy === "string" ? event.createdBy : undefined,
    createdAt: typeof event.createdAt === "string" ? event.createdAt : undefined,
    updatedAt: typeof event.updatedAt === "string" ? event.updatedAt : undefined,
  };
}

export async function fetchCalendarEvents(params?: CalendarFilterParams): Promise<CalendarEvent[]> {
  const query = new URLSearchParams();
  const effectiveStart = params?.startDate || params?.start;
  const effectiveEnd = params?.endDate || params?.end;

  if (effectiveStart) {
    query.set("startDate", effectiveStart);
    query.set("start", effectiveStart);
  }
  if (effectiveEnd) {
    query.set("endDate", effectiveEnd);
    query.set("end", effectiveEnd);
  }
  if (params?.type) query.set("type", params.type);
  if (params?.trackId) query.set("trackId", params.trackId);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  const { data } = await api.get<ApiResponse<{ events: Record<string, unknown>[] }>>(
    `/calendar/events${qs ? `?${qs}` : ""}`,
  );
  const rawEvents = (data.data as { events?: Record<string, unknown>[] })?.events ?? [];
  return rawEvents.map(normalizeEvent);
}

export async function createCalendarEvent(payload: CreateCalendarEventPayload): Promise<CalendarEvent> {
  const body = {
    ...payload,
    startAt: payload.start,
    endAt: payload.end || payload.start,
    isAllDay: payload.allDay ?? false,
    color: payload.color || EVENT_TYPE_COLORS[payload.type]?.hex || "#6366F1",
    status: payload.status || "pending",
  };
  const { data } = await api.post<ApiResponse<{ event: Record<string, unknown> }>>("/calendar/events", body);
  return normalizeEvent(data.data.event);
}

export async function updateCalendarEvent(
  eventId: string,
  payload: UpdateCalendarEventPayload,
): Promise<CalendarEvent> {
  const body: Record<string, unknown> = { ...payload };
  if (payload.start) body.startAt = payload.start;
  if (payload.end) body.endAt = payload.end;
  if (payload.allDay !== undefined) body.isAllDay = payload.allDay;

  const { data } = await api.put<ApiResponse<{ event: Record<string, unknown> }>>(`/calendar/events/${eventId}`, body);
  return normalizeEvent(data.data.event);
}

export async function deleteCalendarEvent(eventId: string): Promise<{ success: boolean }> {
  await api.delete(`/calendar/events/${eventId}`);
  return { success: true };
}

export async function syncSessionsToCalendar(): Promise<number> {
  const { data } = await api.post<ApiResponse<{ count: number }>>("/calendar/sync-sessions");
  return data.data?.count ?? 0;
}

export async function downloadCalendarFile(filename = "ethiotech-calendar.ics"): Promise<void> {
  const response = await api.get("/calendar/ical", { responseType: "blob" });
  const blob = new Blob([response.data], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
