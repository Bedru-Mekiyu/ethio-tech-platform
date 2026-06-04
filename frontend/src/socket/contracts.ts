type MessageType = "public" | "direct" | "question" | "announcement" | "private_question" | "system";

export interface ChatMessageServerPayload {
  roomId?: string;
  messageId?: string;
  text?: string;
  at?: string;
  userId?: string;
  author?: string;
  clientId?: string;
  type?: MessageType;
  recipientId?: string;
  system?: boolean;
  announcement?: boolean;
}
