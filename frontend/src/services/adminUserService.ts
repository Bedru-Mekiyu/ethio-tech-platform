import { api, type ApiResponse } from "./api";

export interface AdminUser {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  role: string;
  status?: string;
  statusReason?: string;
  statusChangedAt?: string;
  mentorStatus?: string;
  mentorScore?: number;
  totalSessions?: number;
  mentorRating?: number;
  feedbackScore?: number;
  attendanceRate?: number;
  isVerified?: boolean;
  verifiedAt?: string;
  level?: number;
  xp?: number;
  credits?: number;
  avatar?: string;
  avatarUrl?: string;
  avatarType?: string;
  avatarSource?: string;
  bio?: string;
  phone?: string;
  city?: string;
  gradeLevel?: number;
  expertise?: string[];
  currentCompany?: string;
  learningInterests?: string[];
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
  restoredAt?: string;
  statusChangedBy?: string;
  verifiedBy?: string;
  daysSinceDeletion?: number;
  canBePermanentlyDeleted?: boolean;
}

export interface AdminUserAnalytics {
  metrics: {
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    returningUsers: number;
    dormantUsers: number;
    signups: { today: number; thisWeek: number; thisMonth: number };
    engagement: { activeRate: number; returnRate: number; dormantRate: number };
  };
  byStatus: Record<string, number>;
  byRole: Record<string, number>;
  mentorStats: Record<string, { count: number; avgScore: number }>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  pagination: PaginationInfo;
}

export interface AdminActivityLogEntry {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  actor?: { _id: string; fullName?: string; email?: string; role?: string };
  targetUser?: { _id: string; fullName?: string; email?: string; role?: string };
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
}

export const adminUserService = {
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    sort?: string;
    mentorStatus?: string;
    isVerified?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AdminUsersResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    const { data } = await api.get<ApiResponse<AdminUsersResponse>>(`/admin/users?${query}`);
    return data.data;
  },

  async getUserById(id: string): Promise<{ user: AdminUser }> {
    const { data } = await api.get<ApiResponse<{ user: AdminUser }>>(`/admin/users/${id}`);
    return data.data;
  },

  async createUser(payload: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    gradeLevel?: number;
    city?: string;
    bio?: string;
    phone?: string;
    expertise?: string[];
    currentCompany?: string;
  }): Promise<{ user: AdminUser }> {
    const { data } = await api.post<ApiResponse<{ user: AdminUser }>>("/admin/users", payload);
    return data.data;
  },

  async updateUser(id: string, payload: Record<string, unknown>): Promise<{ user: AdminUser }> {
    const { data } = await api.patch<ApiResponse<{ user: AdminUser }>>(`/admin/users/${id}`, payload);
    return data.data;
  },

  async changeRole(id: string, role: string): Promise<void> {
    await api.patch(`/admin/users/${id}/role`, { role });
  },

  async verifyUser(id: string): Promise<void> {
    await api.post(`/admin/users/${id}/verify`);
  },

  async suspendUser(id: string, reason?: string): Promise<void> {
    await api.post(`/admin/users/${id}/suspend`, { reason });
  },

  async reactivateUser(id: string): Promise<void> {
    await api.post(`/admin/users/${id}/reactivate`);
  },

  async banUser(id: string, reason?: string): Promise<void> {
    await api.post(`/admin/users/${id}/ban`, { reason });
  },

  async softDelete(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  async restoreUser(id: string): Promise<{ user: AdminUser }> {
    const { data } = await api.post<ApiResponse<{ user: AdminUser }>>(`/admin/users/${id}/restore`);
    return data.data;
  },

  async permanentDelete(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}/permanent`);
  },

  async forceLogout(id: string): Promise<void> {
    await api.post(`/admin/users/${id}/force-logout`);
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.post(`/admin/users/${id}/reset-password`, { newPassword });
  },

  async bulkAction(payload: {
    action: string;
    userIds: string[];
    reason?: string;
  }): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const { data } = await api.post<ApiResponse<{ success: string[]; failed: Array<{ id: string; error: string }> }>>(
      "/admin/bulk",
      payload
    );
    return data.data;
  },

  async exportUsers(params: Record<string, string>): Promise<Blob> {
    const query = new URLSearchParams(params);
    const response = await api.get<Blob>(`/admin/users/export?${query}`, {
      responseType: "blob",
    });
    return response.data;
  },

  async getAnalytics(): Promise<AdminUserAnalytics> {
    const { data } = await api.get<ApiResponse<AdminUserAnalytics>>("/admin/users/analytics");
    return data.data;
  },

  async getDeletedUsers(page = 1, limit = 20): Promise<AdminUsersResponse> {
    const { data } = await api.get<ApiResponse<AdminUsersResponse>>(`/admin/users/deleted?page=${page}&limit=${limit}`);
    return data.data;
  },

  async sendAnnouncement(payload: {
    recipientIds: string[];
    message: string;
    link?: string;
  }): Promise<void> {
    await api.post("/admin/announcements", payload);
  },

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
  }): Promise<{ logs: AdminActivityLogEntry[]; pagination: PaginationInfo }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    const { data } = await api.get<ApiResponse<{ logs: AdminActivityLogEntry[]; pagination: PaginationInfo }>>(
      `/admin/audit-logs?${query}`
    );
    return data.data;
  },
};
