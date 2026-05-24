import { api, type ApiResponse } from "./api";

export interface SessionSummary {
  _id: string;
  title: string;
  scheduledAt: string;
  status?: string;
  liveRoomId?: string;
}

export interface SessionDetail extends SessionSummary {
  durationMinutes?: number;
  classroomMode?: string;
  liveProvider?: string;
  whiteboardEnabled?: boolean;
  codeCollabEnabled?: boolean;
  mentor?: { _id?: string; fullName?: string; avatar?: string; role?: string; mentorScore?: number; totalSessions?: number };
  participants?: Array<{ _id?: string; fullName?: string; avatar?: string; role?: string; level?: number }>;
}

export async function fetchSessions() {
  const { data } = await api.get<ApiResponse<{ sessions: SessionSummary[] }>>("/sessions");
  return (data.data as { sessions?: SessionSummary[] }).sessions ?? [];
}

export async function getLiveAccess(sessionId: string) {
  const { data } = await api.get<
    ApiResponse<{ roomId: string; accessToken: string; sessionId: string }>
  >(`/sessions/${sessionId}/live-access`);
  return data.data;
}

export async function fetchSessionById(sessionId: string) {
  const { data } = await api.get<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}`);
  return data.data.session;
}

export async function submitSessionFeedback(
  sessionId: string,
  payload: { quality: number; engagement: number; impact: number; comment?: string }
) {
  const { data } = await api.post(`/sessions/${sessionId}/feedback`, payload);
  return data.data;
}
