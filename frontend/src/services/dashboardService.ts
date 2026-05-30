import axios from "axios";
import { api, API_ORIGIN, type ApiResponse } from "./api";
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
  assignedProjects?: Array<{
    projectId: string;
    title: string;
    description?: string;
    trackId?: string;
    trackTitle: string;
    difficulty?: string;
    xpReward?: number;
    category: "active" | "feedback" | "completed";
    completionPercent: number;
    submissionStatus: string;
    feedback?: string;
    grade?: number;
    submittedAt?: string;
    updatedAt?: string;
    githubLink?: string;
    deployedUrl?: string;
  }>;
  leaderboardPosition?: number;
  streak?: { currentStreak?: number; longestStreak?: number; lastActiveDate?: string };
  dailyChallenge?: {
    _id?: string;
    title: string;
    description?: string;
    xpReward?: number;
    activeDate?: string;
  } | null;
  dailyChallengeCompleted?: boolean;
  onboarding?: {
    completed: number;
    total: number;
    percent: number;
    items: Array<{
      key: string;
      label: string;
      completed: boolean;
      href: string;
    }>;
  };
  nextActions?: Array<{ label: string; href: string }>;
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
  status?: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewedNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAuditLog {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  actor?: { fullName?: string; email?: string; role?: string };
  metadata?: { method?: string; path?: string };
  ip?: string;
  createdAt?: string;
}

export interface PlatformHealthData {
  live?: {
    status: string;
    mission?: string;
    version?: string;
    timestamp?: string;
  };
  ready?: {
    status: string;
    database?: string;
    timestamp?: string;
  };
  realtime?: {
    status: string;
    rooms?: number;
    activeSockets?: number;
    uptimeSeconds?: number;
    timestamp?: string;
  };
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

export async function fetchAdminAuditLogs() {
  const { data } = await api.get<ApiResponse<{ logs: AdminAuditLog[] }>>("/admin/audit-logs");
  return data.data;
}

export async function fetchPlatformHealth(): Promise<PlatformHealthData> {
  const [live, ready, realtime] = await Promise.all([
    axios.get(`${API_ORIGIN}/health`).then((res) => res.data),
    axios.get(`${API_ORIGIN}/health/ready`, { validateStatus: () => true }).then((res) => res.data),
    axios.get(`${API_ORIGIN}/health/realtime`).then((res) => res.data),
  ]);

  return { live, ready, realtime };
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
