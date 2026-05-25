import { api, type ApiResponse } from "./api";

export interface NotificationItem {
  _id: string;
  message: string;
  type?: string;
  link?: string;
  isRead?: boolean;
  createdAt: string;
}

export async function fetchMyNotifications() {
  const { data } = await api.get<ApiResponse<{ notifications: NotificationItem[] }>>("/notifications/me");
  return (data.data as { notifications?: NotificationItem[] }).notifications ?? [];
}

export async function markNotificationRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch("/notifications/read-all");
}
