import { api, type ApiResponse } from "./api";

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: "homework" | "quiz" | "project" | "reading" | "peer_review";
  track: string;
  module?: string;
  lesson?: string;
  mentor?: string;
  dueDate: string;
  maxScore: number;
  rubric: { criteria: string; points: number }[];
  attachments: { name: string; url: string; type: string }[];
  latePenalty: { enabled: boolean; percentagePerDay: number };
  allowedLateSubmissions: number;
  estimatedMinutes: number;
  tags: string[];
  isPublished: boolean;
  status?: "pending" | "submitted" | "graded" | "returned" | "late";
  submission?: { _id: string; grade: number; status: string; submittedAt: string } | null;
}

export async function fetchAssignments(params?: { track?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.track) query.set("track", params.track);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const { data } = await api.get<ApiResponse<{ assignments: Assignment[] }>>(
    `/assignments${qs ? `?${qs}` : ""}`
  );
  return (data.data as { assignments?: Assignment[] }).assignments ?? [];
}

export async function fetchAssignmentById(id: string) {
  const { data } = await api.get<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}`);
  return data.data.assignment;
}

export async function submitAssignment(
  assignmentId: string,
  payload: { githubLink?: string; deployedUrl?: string; files?: string[]; text?: string }
) {
  const { data } = await api.post<ApiResponse<{ submission: unknown }>>(
    `/assignments/${assignmentId}/submit`,
    payload
  );
  return data.data.submission;
}

export async function fetchMySubmissions() {
  const { data } = await api.get<ApiResponse<{ submissions: unknown[] }>>("/assignments/my-submissions");
  return (data.data as { submissions?: unknown[] }).submissions ?? [];
}

export async function fetchOverdueAssignments() {
  const { data } = await api.get<ApiResponse<{ assignments: Assignment[]; total: number }>>(
    "/assignments/overdue"
  );
  return data.data;
}
