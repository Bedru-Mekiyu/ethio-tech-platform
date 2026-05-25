import { api, type ApiResponse } from "./api";

export interface DailyChallenge {
  _id?: string;
  title: string;
  description?: string;
  xpReward?: number;
  activeDate?: string;
}

export const fetchDailyChallenge = async () => {
  const { data } = await api.get<
    ApiResponse<{
      challenge: DailyChallenge | null;
      completed: boolean;
      completedAt?: string | null;
    }>
  >("/gamification/daily-challenge");
  return data.data;
};

export const completeDailyChallenge = async () => {
  const { data } = await api.post<
    ApiResponse<{
      challenge: DailyChallenge;
      alreadyCompleted: boolean;
      xp: number | null;
      newBadges?: Array<{ name: string }>;
    }>
  >("/gamification/daily-challenge/complete");
  return data.data;
};

export const pingDailyStreak = async () => {
  const { data } = await api.post<ApiResponse<{ streak: unknown; newBadges?: unknown[] }>>(
    "/gamification/streak/ping"
  );
  return data.data;
};
