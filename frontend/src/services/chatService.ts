import { api, type ApiResponse } from "./api";

export interface ChatHistoryMessage {
  messageId?: string;
  text: string;
  at: string;
  userId?: string;
  author?: string;
}

export const fetchRoomMessages = async (roomId: string, limit = 50) => {
  const { data } = await api.get<
    ApiResponse<{
      messages: ChatHistoryMessage[];
      pagination: { limit: number; hasMore: boolean };
    }>
  >(`/chat/rooms/${encodeURIComponent(roomId)}/messages`, { params: { limit } });
  return data.data.messages;
};
