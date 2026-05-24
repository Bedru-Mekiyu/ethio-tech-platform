import { api, type ApiResponse } from "./api";

export interface SubmissionReviewItem {
  _id: string;
  status?: string;
  feedback?: string;
  grade?: number;
  createdAt?: string;
  updatedAt?: string;
  reviewedBy?: { fullName?: string; role?: string };
  student?: { _id?: string; fullName?: string; email?: string };
  project?: { _id?: string; title?: string; xpReward?: number; track?: { title?: string } };
  githubLink?: string;
  deployedUrl?: string;
  files?: string[];
}

export async function fetchSubmissionQueue() {
  const { data } = await api.get<ApiResponse<{ submissions: SubmissionReviewItem[] }>>("/submissions");
  return data.data.submissions ?? [];
}

export async function reviewSubmissionItem(
  id: string,
  payload: { status: "reviewed" | "approved" | "rejected"; feedback?: string; grade?: number }
) {
  const { data } = await api.patch<ApiResponse<{ submission: SubmissionReviewItem }>>(
    `/submissions/${id}/review`,
    payload
  );
  return data.data.submission;
}
