import { api, type ApiResponse } from "./api";

export interface XpLogEntry {
  _id: string;
  amount: number;
  reason?: string;
  sourceType?: string;
  createdAt: string;
}

export async function fetchXpHistory() {
  const { data } = await api.get<ApiResponse<{ logs: XpLogEntry[] }>>("/xp/me/history");
  const payload = data.data as { logs?: XpLogEntry[] };
  return payload.logs ?? [];
}

export async function fetchXpSummary() {
  const { data } = await api.get<ApiResponse<{ user: { xp?: number; level?: number } }>>("/xp/me/summary");
  return data.data;
}
