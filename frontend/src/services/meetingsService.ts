import { api, type ApiResponse } from "./api";
import type { MeetingViewModel, MeetingStatus } from "@/lib/realtime";

export interface MeetingListResponse {
  meetings: MeetingViewModel[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface MeetingStatusResponse {
  meeting: MeetingViewModel;
  sessionId: string;
  status: MeetingStatus;
  hostJoined: boolean;
  presenceCount: number;
  joinable: boolean;
  startsInMs: number | null;
  endsAt: string | null;
}

export interface AdminMeetingListItem extends MeetingViewModel {
  attendance?: {
    totalParticipants: number;
    joinedCount: number;
    verifiedCount: number;
    totalPresenceMs: number;
  };
  logs?: Array<{
    _id: string;
    session: string;
    action: string;
    actor?: { _id?: string; fullName?: string; role?: string };
    targetUser?: string;
    metadata?: unknown;
    createdAt: string;
  }>;
}

export async function fetchMeetingStatus(sessionId: string) {
  const { data } = await api.get<ApiResponse<MeetingStatusResponse>>(`/meetings/status/${sessionId}`);
  return data.data as unknown as MeetingStatusResponse;
}

export async function fetchMyMeetings(params?: {
  scope?: "upcoming" | "past" | "all";
  status?: MeetingStatus | "all";
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.scope) query.set("scope", params.scope);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const { data } = await api.get<ApiResponse<MeetingListResponse>>(`/meetings/mine${qs ? `?${qs}` : ""}`);
  return (data.data as unknown as MeetingListResponse) ?? { meetings: [], pagination: undefined };
}

export async function fetchAdminMeetings(params?: {
  status?: MeetingStatus | "all";
  q?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.q) query.set("q", params.q);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const { data } = await api.get<
    ApiResponse<{ meetings: AdminMeetingListItem[]; pagination?: MeetingListResponse["pagination"] }>
  >(`/meetings/admin${qs ? `?${qs}` : ""}`);
  return data.data as unknown as { meetings: AdminMeetingListItem[]; pagination?: MeetingListResponse["pagination"] };
}

export async function fetchMeetingAttendance(sessionId: string) {
  const { data } = await api.get<ApiResponse<unknown>>(`/meetings/${sessionId}/attendance`);
  return data.data;
}

export async function forceEndMeeting(sessionId: string, reason?: string) {
  const { data } = await api.post<ApiResponse<{ session: { _id: string; status: string } }>>(
    `/meetings/${sessionId}/force-end`,
    { reason },
  );
  return data.data;
}
