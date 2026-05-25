import { api, type ApiResponse } from "./api";

export interface PeerGroup {
  _id: string;
  name: string;
  groupXP?: number;
}

export async function fetchMyPeerGroups() {
  const { data } = await api.get<ApiResponse<{ groups: PeerGroup[] }>>("/peer-groups?mine=true");
  const payload = data.data as { groups?: PeerGroup[] };
  return payload.groups ?? (Array.isArray(data.data) ? (data.data as PeerGroup[]) : []);
}

export async function fetchPeerGroupById(id: string) {
  const { data } = await api.get<ApiResponse<{ group: PeerGroup & { members?: unknown[] } }>>(
    `/peer-groups/${id}`
  );
  return data.data.group;
}
