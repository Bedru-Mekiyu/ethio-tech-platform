import { api, type ApiResponse } from "./api";

export interface TrackSummary {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  xpReward?: number;
  modules?: Array<{ _id: string; title: string; lessons?: Array<{ _id: string; title: string; order?: number; xpReward?: number }> }>;
}

export interface LessonDetail {
  _id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  codeSandboxUrl?: string;
  xpReward?: number;
  module: string;
  durationMinutes?: number;
}

export interface LeaderboardEntry {
  _id?: string;
  fullName: string;
  avatar?: string;
  xp?: number;
  level?: number;
}

export interface MentorLeaderboardEntry {
  _id?: string;
  fullName: string;
  mentorScore?: number;
  totalSessions?: number;
}

export interface PeerGroupLeaderboardEntry {
  _id?: string;
  name: string;
  groupXP?: number;
  members?: number[];
  leader?: { fullName?: string };
}

export async function fetchTracks() {
  const { data } = await api.get<
    ApiResponse<{ items: TrackSummary[] } | { tracks: TrackSummary[] }>
  >("/tracks");
  const payload = data.data as { items?: TrackSummary[]; tracks?: TrackSummary[] };
  return payload.items ?? payload.tracks ?? [];
}

export async function fetchTrackById(trackId: string) {
  const { data } = await api.get<ApiResponse<{ track: TrackSummary }>>(`/tracks/${trackId}`);
  return (data.data as { track: TrackSummary }).track;
}

export async function fetchLessonById(lessonId: string) {
  const { data } = await api.get<ApiResponse<{ lesson: LessonDetail }>>(`/lessons/${lessonId}`);
  return (data.data as { lesson: LessonDetail }).lesson;
}

export async function completeLesson(lessonId: string) {
  const { data } = await api.post<ApiResponse<{ xpAdded?: number }>>(`/lessons/${lessonId}/complete`);
  return data.data;
}

export async function fetchLeaderboard(top = 10): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<ApiResponse<{ students: LeaderboardEntry[] }>>(
    `/leaderboard/students?top=${top}`
  );
  const payload = data.data as { students?: LeaderboardEntry[]; leaderboard?: LeaderboardEntry[] };
  return payload.students ?? payload.leaderboard ?? [];
}

export async function fetchMentorLeaderboard(top = 10): Promise<MentorLeaderboardEntry[]> {
  const { data } = await api.get<ApiResponse<{ mentors: MentorLeaderboardEntry[] }>>(
    `/leaderboard/mentors?top=${top}`
  );
  return (data.data as { mentors?: MentorLeaderboardEntry[] }).mentors ?? [];
}

export async function fetchPeerGroupLeaderboard(top = 10): Promise<PeerGroupLeaderboardEntry[]> {
  const { data } = await api.get<ApiResponse<{ groups: PeerGroupLeaderboardEntry[] }>>(
    `/leaderboard/peer-groups?top=${top}`
  );
  return (data.data as { groups?: PeerGroupLeaderboardEntry[] }).groups ?? [];
}

export async function fetchBadges() {
  const { data } = await api.get<ApiResponse<{ badges: Array<{ _id: string; name: string; description?: string; category?: string; xpRequired?: number }> }>>("/badges");
  return (data.data as { badges?: unknown[] }).badges ?? [];
}
