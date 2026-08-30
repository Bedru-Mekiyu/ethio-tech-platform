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
  liveStartedAt?: string;
  whiteboardEnabled?: boolean;
  codeCollabEnabled?: boolean;
  screenShareActive?: boolean;
  screenShareUserId?: string;
  recordingMode?: string;
  mentor?: {
    _id?: string;
    fullName?: string;
    avatar?: string;
    role?: string;
    mentorScore?: number;
    totalSessions?: number;
  };
  participants?: Array<{ _id?: string; fullName?: string; avatar?: string; role?: string; level?: number }>;
}

export interface SessionAvailability {
  registeredCount: number;
  maxCapacity: number;
  remainingSeats: number;
  waitlistCount: number;
  isFull: boolean;
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
  role: string;
  identity: string;
  name: string;
  sessionId: string;
}

export interface LiveKitConfigResponse {
  url: string;
  enabled: boolean;
}

export interface JitsiTokenResponse {
  roomName: string;
  domain: string;
  token: string | null;
  role: string;
  sessionId: string;
}

export interface JitsiConfigResponse {
  domain: string;
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

export async function startSession(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}/start`);
  return data.data.session;
}

export async function endSession(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}/end`);
  return data.data.session;
}

export async function pauseSession(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}/pause`);
  return data.data.session;
}

export async function resumeSession(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>(`/sessions/${sessionId}/resume`);
  return data.data.session;
}

export async function closeRegistration(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>(
    `/sessions/${sessionId}/close-registration`,
  );
  return data.data.session;
}

export async function rescheduleSession(
  sessionId: string,
  payload: { scheduledAt: string; reason?: string },
) {
  const { data } = await api.post<ApiResponse<{ session: SessionDetail }>>(
    `/sessions/${sessionId}/reschedule`,
    payload,
  );
  return data.data.session;
}

export async function joinLiveSession(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ joined: boolean; presenceCount: number }>>(
    `/sessions/${sessionId}/join`,
  );
  return data.data;
}

export async function leaveLiveSession(sessionId: string) {
  const { data } = await api.post<ApiResponse<{ left: boolean; presenceCount: number }>>(
    `/sessions/${sessionId}/leave`,
  );
  return data.data;
}

export async function getSessionAvailability(sessionId: string) {
  const { data } = await api.get<ApiResponse<SessionAvailability>>(`/sessions/${sessionId}/availability`);
  return data.data as unknown as SessionAvailability;
}

export async function submitSessionFeedback(
  sessionId: string,
  payload: { quality: number; engagement: number; impact: number; comment?: string },
) {
  const { data } = await api.post(`/sessions/${sessionId}/feedback`, payload);
  return data.data;
}

export async function getLiveKitConfig() {
  const { data } = await api.get<ApiResponse<LiveKitConfigResponse>>("/sessions/livekit-config");
  return data.data as unknown as LiveKitConfigResponse;
}

export async function getLiveKitToken(sessionId: string) {
  const { data } = await api.post<ApiResponse<LiveKitTokenResponse>>(`/sessions/${sessionId}/livekit-token`);
  return data.data as unknown as LiveKitTokenResponse;
}

export async function muteLiveKitParticipant(sessionId: string, payload: { identity: string; trackSid: string; muted?: boolean }) {
  const { data } = await api.post(`/sessions/${sessionId}/mute-participant`, payload);
  return data.data;
}

export async function kickLiveKitParticipant(sessionId: string, payload: { identity: string }) {
  const { data } = await api.post(`/sessions/${sessionId}/remove-participant`, payload);
  return data.data;
}

export async function getJitsiConfig() {
  const { data } = await api.get<ApiResponse<JitsiConfigResponse>>("/sessions/livekit-config");
  return data.data as unknown as JitsiConfigResponse;
}

export async function getJitsiToken(sessionId: string) {
  const { data } = await api.post<ApiResponse<JitsiTokenResponse>>(`/sessions/${sessionId}/livekit-token`);
  return data.data as unknown as JitsiTokenResponse;
}
