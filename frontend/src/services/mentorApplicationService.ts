import { api, type ApiResponse } from "@/services/api";

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
