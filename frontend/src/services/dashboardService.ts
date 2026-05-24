import { api, type ApiResponse } from "./api";
import type { AuthUser } from "@/store/authStore";

export interface StudentDashboardData {
  user?: AuthUser & { badges?: Array<{ _id?: string; name: string; category?: string }> };
  recentXp?: Array<{ amount: number; reason: string; createdAt: string }>;
  upcomingSessions?: Array<{ _id?: string; title: string; scheduledAt: string; status?: string }>;
  recentSubmissions?: Array<{ project?: { title?: string }; status?: string; createdAt?: string }>;
  progressByTrack?: Array<{ trackId?: string; title: string; overallProgressPercent: number }>;
  leaderboardPosition?: number;
}

export interface MentorDashboardData {
  mentor?: AuthUser & { mentorScore?: number; totalSessions?: number; expertise?: string[] };
  mySessions?: Array<{
    _id?: string;
    title: string;
    scheduledAt: string;
    status?: string;
    participants?: Array<string | { _id?: string }>;
  }>;
  upcomingSessions?: Array<{
    _id?: string;
    title: string;
    scheduledAt: string;
    status?: string;
    participants?: Array<string | { _id?: string }>;
  }>;
  reviewsDone?: Array<{
    project?: { title?: string };
    status?: string;
    updatedAt?: string;
  }>;
  recentXpEvents?: Array<{ amount: number; reason: string; createdAt: string }>;
  pendingReviews?: number;
  activeStudents?: number;
  contributionMetrics?: {
    quality: number;
    engagement: number;
    impact: number;
    feedbackCount: number;
  };
}

export interface AdminAnalyticsData {
  metrics?: {
    activeLearners?: number;
    totalStudents?: number;
    mentorNetwork?: number;
    xpEarned30d?: number;
    sessionFillRate?: number;
  };
  topMentors?: Array<{ fullName?: string; mentorScore?: number; totalSessions?: number }>;
  xpByTrack?: Array<{ title?: string; xpTotal?: number }>;
  upcomingSessions?: Array<{ title?: string; scheduledAt?: string; status?: string }>;
}

export async function fetchStudentDashboard() {
  const { data } = await api.get<ApiResponse<StudentDashboardData>>("/dashboard/student");
  return data.data;
}

export async function fetchMentorDashboard() {
  const { data } = await api.get<ApiResponse<MentorDashboardData>>("/dashboard/mentor");
  return data.data;
}

export async function fetchAdminAnalytics() {
  const { data } = await api.get<ApiResponse<AdminAnalyticsData>>("/admin/analytics");
  return data.data;
}

export async function fetchAdminUsers() {
  const { data } = await api.get<
    ApiResponse<{
      items: Array<AuthUser & { _id?: string; avatar?: string; bio?: string; createdAt?: string }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>
  >("/users?limit=8");
  return data.data;
}
