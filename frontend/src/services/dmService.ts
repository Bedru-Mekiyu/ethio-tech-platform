import { api, type ApiResponse } from "./api";

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  participants: Array<{ _id: string; fullName: string; avatar?: string; role: string }>;
  name?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
}

export interface DMMessage {
  _id: string;
  conversationId: string;
  senderId: { _id: string; fullName: string; avatar?: string };
  text: string;
  type: "text" | "image" | "file" | "system";
  createdAt: string;
  readBy: Array<{ userId: string; readAt: string }>;
  replyTo?: { _id: string; text: string };
}

export const fetchConversations = async (page = 1, limit = 20) => {
  const { data } = await api.get<ApiResponse<{ conversations: Conversation[]; total: number }>>(
    "/dm/conversations",
    { params: { page, limit } }
  );
  return data.data;
};

export const createConversation = async (participantId: string) => {
  const { data } = await api.post<ApiResponse<{ conversation: Conversation }>>(
    "/dm/conversations",
    { participantId }
  );
  return data.data.conversation;
};

export const fetchMessages = async (conversationId: string, page = 1, limit = 50) => {
  const { data } = await api.get<ApiResponse<{ messages: DMMessage[] }>>(
    `/dm/${conversationId}/messages`,
    { params: { page, limit } }
  );
  return data.data.messages;
};

export const sendMessage = async (conversationId: string, text: string) => {
  const { data } = await api.post<ApiResponse<{ message: DMMessage }>>(
    `/dm/${conversationId}/messages`,
    { text }
  );
  return data.data.message;
};

export const markRead = async (conversationId: string) => {
  await api.post(`/dm/${conversationId}/read`);
};
