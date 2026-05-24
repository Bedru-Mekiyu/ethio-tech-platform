import { api, type ApiResponse } from "./api";
import type { AuthUser } from "@/store/authStore";

export interface StudentDashboardData {
  user?: AuthUser & {
    badges?: Array<{ _id?: string; name: string; category?: string }>;
    enrolledTracks?: Array<{ _id: string; title: string; category?: string }>;
  };
  recentXp?: Array<{ amount: number; reason: string; createdAt: string }>;
  upcomingSessions?: Array<{ _id?: string; title: string; scheduledAt: string; status?: string }>;
  recentSubmissions?: Array<{ project?: { title?: string }; status?: string; createdAt?: string }>;
  progressByTrack?: Array<{
    trackId?: string;
    title: string;
    overallProgressPercent: number;
    lessons: { completed: number; total: number; progressPercent: number };
    projects: { approved: number; total: number; progressPercent: number };
  }>;
  leaderboardPosition?: number;
  streak?: { currentStreak?: number; longestStreak?: number; lastActiveDate?: string };
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

export interface AdminMentorApplication {
  _id: string;
  fullName: string;
  email: string;
  currentRole: string;
  currentCompany?: string;
  location?: string;
  yearsExperience?: number;
  expertise?: string[];
  availability?: "weeknights" | "weekends" | "flexible" | "ad-hoc";
  mentoringStyle?: Array<"live-sessions" | "project-reviews" | "office-hours" | "cohort-support">;
  whyMentor?: string;
  linkedin?: string;
  portfolio?: string;
  status?: "pending" | "in-review" | "approved" | "rejected";
  reviewedAt?: string;
  reviewedNotes?: string;
  createdAt?: string;
  updatedAt?: string;
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

export async function fetchAdminMentorApplications() {
  const { data } = await api.get<ApiResponse<{ applications: AdminMentorApplication[] }>>(
    "/admin/mentor-applications"
  );
  return data.data;
}

export async function reviewAdminMentorApplication(payload: {
  id: string;
  status: NonNullable<AdminMentorApplication["status"]>;
  reviewedNotes?: string;
}) {
  const { id, ...body } = payload;
  const { data } = await api.patch<ApiResponse<{ application: AdminMentorApplication }>>(
    `/admin/mentor-applications/${id}`,
    body
  );
  return data.data;
}
