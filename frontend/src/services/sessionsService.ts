import { api, type ApiResponse } from "./api";

export interface SessionSummary {
  _id: string;
  title: string;
  scheduledAt: string;
  status?: string;
  liveRoomId?: string;
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

export async function submitSessionFeedback(
  sessionId: string,
  payload: { quality: number; engagement: number; impact: number; comment?: string }
) {
  const { data } = await api.post(`/sessions/${sessionId}/feedback`, payload);
  return data.data;
}
