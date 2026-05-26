import { api, type ApiResponse } from "./api";

export interface ParentLearner {
  id: string;
  fullName: string;
  email?: string;
  level?: number;
  xp?: number;
  gradeLevel?: number;
  lessonsCompleted: number;
  submissions: number;
  approvedProjects: number;
  enrolledTrackCount: number;
}

export interface ParentDashboardData {
  parent: { id: string; fullName: string; email?: string };
  learners: ParentLearner[];
  hasLinkedStudents: boolean;
}

export const fetchParentDashboard = async () => {
  const { data } = await api.get<ApiResponse<ParentDashboardData>>("/parent/dashboard");
  return data.data;
};
