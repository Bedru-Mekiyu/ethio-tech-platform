import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationBadge {
  count: number;
  lastChecked: string;
}

interface NotificationState {
  badge: NotificationBadge;
  setBadgeCount: (count: number) => void;
  incrementBadge: () => void;
  clearBadge: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      badge: { count: 0, lastChecked: new Date().toISOString() },
      setBadgeCount: (count) =>
        set({ badge: { count, lastChecked: new Date().toISOString() } }),
      incrementBadge: () =>
        set((state) => ({
          badge: {
            count: state.badge.count + 1,
            lastChecked: state.badge.lastChecked,
          },
        })),
      clearBadge: () =>
        set({ badge: { count: 0, lastChecked: new Date().toISOString() } }),
    }),
    { name: "ethiotech-notifications" }
  )
);
