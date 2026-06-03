import { api, type ApiResponse } from "./api";

export interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  type: "session" | "deadline" | "milestone" | "custom";
  start: string;
  end: string;
  allDay: boolean;
  sessionId?: string;
  trackId?: string;
  assignmentId?: string;
  color?: string;
  location?: string;
  url?: string;
  reminder?: { enabled: boolean; minutesBefore: number };
  createdBy: string;
}

export async function fetchCalendarEvents(params?: {
  start?: string;
  end?: string;
  type?: string;
  trackId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.start) query.set("start", params.start);
  if (params?.end) query.set("end", params.end);
  if (params?.type) query.set("type", params.type);
  if (params?.trackId) query.set("trackId", params.trackId);
  const qs = query.toString();
  const { data } = await api.get<ApiResponse<{ events: CalendarEvent[] }>>(
    `/calendar/events${qs ? `?${qs}` : ""}`
  );
  return (data.data as { events?: CalendarEvent[] }).events ?? [];
}

export async function createCalendarEvent(payload: Partial<CalendarEvent> & { title: string; start: string; end: string }) {
  const { data } = await api.post<ApiResponse<{ event: CalendarEvent }>>("/calendar/events", payload);
  return data.data.event;
}

export async function updateCalendarEvent(eventId: string, payload: Partial<CalendarEvent>) {
  const { data } = await api.put<ApiResponse<{ event: CalendarEvent }>>(`/calendar/events/${eventId}`, payload);
  return data.data.event;
}

export async function deleteCalendarEvent(eventId: string) {
  await api.delete(`/calendar/events/${eventId}`);
}

export async function syncSessionsToCalendar() {
  const { data } = await api.post<ApiResponse<{ count: number }>>("/calendar/sync-sessions");
  return data.data.count;
}

export async function downloadCalendarFile() {
  const response = await api.get("/calendar/ical", { responseType: "blob" });
  const blob = new Blob([response.data], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ethiotech-calendar.ics";
  a.click();
  URL.revokeObjectURL(url);
}
