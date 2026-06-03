import { api, type ApiResponse } from "./api";

export interface SessionSummary {
  _id: string;
  title: string;
  scheduledAt: string;
  status?: string;
  liveRoomId?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  durationMinutes?: number;
  attendeeCount?: number;
  description?: string;
}

export interface SessionDetail extends SessionSummary {
  durationMinutes?: number;
  classroomMode?: string;
  liveProvider?: string;
  whiteboardEnabled?: boolean;
  codeCollabEnabled?: boolean;
  screenShareActive?: boolean;
  screenShareUserId?: string;
  recordingMode?: string;
  mentor?: { _id?: string; fullName?: string; avatar?: string; role?: string; mentorScore?: number; totalSessions?: number };
  participants?: Array<{ _id?: string; fullName?: string; avatar?: string; role?: string; level?: number }>;
}

export interface SessionAvailability {
  registeredCount: number;
  maxCapacity: number;
  remainingSeats: number;
  waitlistCount: number;
  isFull: boolean;
}

export interface AgoraTokenResponse {
  rtcToken: string | null;
  rtmToken: string | null;
  channelName: string;
  appId: string;
  uid: string;
  role: string;
}

export interface AgoraConfigResponse {
  appId: string;
  enabled: boolean;
}

export async function fetchSessions() {
  const { data } = await api.get<ApiResponse<{ sessions: SessionSummary[] }>>("/sessions");
  return (data.data as { sessions?: SessionSummary[] }).sessions ?? [];
}

export async function fetchSessionById(sessionId: string) {
  const { data } = await api.get<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}`);
  return data.data.session;
}

export async function createSession(payload: Partial<SessionDetail> & { title: string; scheduledAt: string }) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>("/sessions", payload);
  return data.data.session;
}

export async function updateSession(sessionId: string, payload: Partial<SessionDetail>) {
  const { data } = await api.patch<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}`, payload);
  return data.data.session;
}

export async function cancelSession(sessionId: string, reason: string) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}/cancel`, { reason });
  return data.data.session;
}

export async function getSessionAvailability(sessionId: string) {
  const { data } = await api.get<ApiResponse<SessionAvailability>>(`/sessions/${sessionId}/availability`);
  return data.data as unknown as SessionAvailability;
}

export async function getLiveAccess(sessionId: string) {
  const { data } = await api.get<
    ApiResponse<{ provider?: string; roomId: string; accessToken: string; sessionId: string; screenShareActive?: boolean; screenShareUserId?: string; recordingMode?: string }>
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

export async function getAgoraConfig() {
  const { data } = await api.get<ApiResponse<AgoraConfigResponse>>("/sessions/agora-config");
  return data.data as unknown as AgoraConfigResponse;
}

export async function getAgoraToken(sessionId: string) {
  const { data } = await api.post<ApiResponse<AgoraTokenResponse>>(`/sessions/${sessionId}/agora-token`);
  return data.data as unknown as AgoraTokenResponse;
}

export async function toggleScreenShare(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ screenShareActive: boolean; screenShareUserId?: string }>>(
    `/sessions/${sessionId}/screen-share`
  );
  return data.data;
}

export async function startRecording(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ recordingMode: string }>>(`/sessions/${sessionId}/recording/start`);
  return data.data;
}

export async function stopRecording(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ recordingMode: string }>>(`/sessions/${sessionId}/recording/stop`);
  return data.data;
}
