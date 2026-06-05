import { api, type ApiResponse } from "./api";

export interface NotificationItem {
  _id: string;
  message: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  session: boolean;
  badge: boolean;
  xp: boolean;
  mentor: boolean;
  project: boolean;
  system: boolean;
  announcement: boolean;
  account_approved: boolean;
  account_rejected: boolean;
  account_suspended: boolean;
  account_banned: boolean;
  role_changed: boolean;
  mentor_approved: boolean;
  mentor_rejected: boolean;
  password_reset: boolean;
  verification: boolean;
}

export async function fetchMyNotifications(page = 1, limit = 20) {
  const { data } = await api.get<ApiResponse<{ notifications: NotificationItem[] }>>("/notifications/me", {
    params: { page, limit },
  });
  return (data.data as { notifications?: NotificationItem[] }).notifications ?? [];
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiResponse<{ count: number }>>("/notifications/unread-count");
  return (data.data as { count?: number }).count ?? 0;
}

export async function markNotificationRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch("/notifications/read-all");
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await api.get<ApiResponse<{ preferences: NotificationPreferences }>>("/notification-preferences");
  return (data.data as { preferences?: NotificationPreferences }).preferences ?? ({} as NotificationPreferences);
}

export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  await api.put("/notification-preferences", { preferences });
}
