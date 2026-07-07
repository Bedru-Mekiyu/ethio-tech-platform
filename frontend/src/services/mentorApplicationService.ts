import { api, type ApiResponse } from "@/services/api";
import type { AuthUser } from "@/store/authStore";

export interface MentorApplication {
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
  cvUrl?: string;
  documents?: Array<{ name: string; url: string }>;
  socialLinks?: { github?: string; twitter?: string; website?: string };
  status: "pending_review" | "approved" | "rejected" | "changes_requested" | "archived";
  userId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewedNotes?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  rejectionHistory?: Array<{
    reason: string;
    reviewedBy?: string;
    reviewedAt: string;
  }>;
  provisionedAt?: string;
  credentialsSentAt?: string;
  credentialsDeliveryMethod?: string;
  reviewStartedAt?: string;
  previousApplicationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueStats {
  pendingReview: number;
  approved: number;
  rejected: number;
  changesRequested: number;
  archived: number;
}

export interface ApplicationDetail {
  application: MentorApplication;
  user: AuthUser | null;
  teaching: {
    sessions: Array<{ title?: string; scheduledAt?: string; status?: string }>;
    studentsCount: number;
    totalSessions: number;
  };
  credentialsStatus: {
    sentAt?: string;
    deliveryMethod?: string;
    provisionedAt?: string;
  };
}

export interface AuditLogEntry {
  _id: string;
  action: string;
  actor?: { fullName?: string; email?: string };
  metadata?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface QueueFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
  track?: string;
  expertise?: string;
  experienceMin?: number;
  experienceMax?: number;
}

function buildQuery(params?: QueueFilterParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.sortOrder) q.set("sortOrder", params.sortOrder);
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  if (params.track) q.set("track", params.track);
  if (params.expertise) q.set("expertise", params.expertise);
  if (params.experienceMin !== undefined) q.set("experienceMin", String(params.experienceMin));
  if (params.experienceMax !== undefined) q.set("experienceMax", String(params.experienceMax));
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchQueueApplications(
  queue: "pending" | "approved" | "rejected" | "changes-requested" | "archived",
  params?: QueueFilterParams
) {
  const qs = buildQuery(params);
  const { data } = await api.get<
    ApiResponse<{ applications: MentorApplication[]; pagination: Pagination }>
  >(`/admin/mentor-applications/${queue}${qs}`);
  return data.data;
}

export async function fetchQueueStats() {
  const { data } = await api.get<ApiResponse<{ stats: QueueStats }>>(
    "/admin/mentor-applications/stats"
  );
  return data.data.stats;
}

export async function fetchApplicationDetail(id: string) {
  const { data } = await api.get<ApiResponse<ApplicationDetail>>(
    `/admin/mentor-applications/${id}`
  );
  return data.data;
}

export async function fetchApplicationAuditLog(id: string, page = 1) {
  const { data } = await api.get<
    ApiResponse<{ logs: AuditLogEntry[]; pagination: Pagination }>
  >(`/admin/mentor-applications/${id}/audit-log?page=${page}&limit=20`);
  return data.data;
}

export async function approveApplication(id: string, reviewNotes?: string) {
  const { data } = await api.post<ApiResponse<{ application: MentorApplication }>>(
    `/admin/mentor-applications/${id}/approve`,
    { reviewNotes }
  );
  return data.data;
}

export async function rejectApplication(id: string, rejectionReason: string) {
  const { data } = await api.post<ApiResponse<{ application: MentorApplication }>>(
    `/admin/mentor-applications/${id}/reject`,
    { rejectionReason }
  );
  return data.data;
}

export async function requestChanges(id: string, reviewNotes: string) {
  const { data } = await api.post<ApiResponse<{ application: MentorApplication }>>(
    `/admin/mentor-applications/${id}/request-changes`,
    { reviewNotes }
  );
  return data.data;
}

export async function startReview(id: string) {
  const { data } = await api.post<ApiResponse<{ application: MentorApplication }>>(
    `/admin/mentor-applications/${id}/start-review`
  );
  return data.data;
}

export async function provisionApplication(id: string) {
  const { data } = await api.post(`/admin/mentor-applications/${id}/provision`);
  return data.data;
}

export async function resendCredentials(id: string) {
  const { data } = await api.post(`/admin/mentor-applications/${id}/resend-credentials`);
  return data.data;
}

export async function resetMentorPassword(id: string) {
  const { data } = await api.post(`/admin/mentor-applications/${id}/reset-password`);
  return data.data;
}

export async function archiveApplication(id: string) {
  const { data } = await api.post<ApiResponse<{ application: MentorApplication }>>(
    `/admin/mentor-applications/${id}/archive`
  );
  return data.data;
}

export async function suspendMentor(id: string, reason?: string) {
  const { data } = await api.post(`/admin/mentor-applications/${id}/suspend`, { reason });
  return data.data;
}

export async function reactivateMentor(id: string) {
  const { data } = await api.post(`/admin/mentor-applications/${id}/reactivate`);
  return data.data;
}

export async function deactivateMentor(id: string) {
  const { data } = await api.post(`/admin/mentor-applications/${id}/deactivate`);
  return data.data;
}

export async function removeMentorRole(id: string, reason?: string) {
  const { data } = await api.post(`/admin/mentor-applications/${id}/remove-role`, { reason });
  return data.data;
}
