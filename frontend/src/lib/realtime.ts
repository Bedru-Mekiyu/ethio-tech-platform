export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export interface RealtimeRoomState {
  roomId: string;
  roomType: "classroom" | "squad" | "generic";
  onlineCount: number;
  connectedUserIds: string[];
  lastActivityAt: string;
  messageCount: number;
  connectionQuality: ConnectionQuality;
}

export interface RoomPresencePayload {
  roomId: string;
  count: number;
  updatedAt: string;
}

export interface HeartbeatAckPayload {
  roomId: string;
  receivedAt: string;
  serverTime: string;
  lagMs: number;
}

export interface RealtimeChatMessage {
  id: string;
  messageId: string;
  roomId: string;
  text: string;
  author: string;
  at: string;
  userId?: string;
  clientId?: string;
  mine?: boolean;
  system?: boolean;
  status?: "pending" | "sent" | "delivered";
}

export interface RealtimeSystemEvent {
  id: string;
  title: string;
  detail: string;
  at: string;
}

export interface OutboxMessage {
  roomId: string;
  messageId: string;
  text: string;
  at: string;
  clientId: string;
}

export interface SocketClientToServerEvents {
  "join-room": (roomId: string) => void;
  "leave-room": (roomId: string) => void;
  "chat:message": (
    payload: OutboxMessage,
    ack?: (response: { ok: boolean; messageId?: string }) => void
  ) => void;
  "classroom:sync": (payload: { roomId: string; state: unknown; revision?: number; clientId?: string }) => void;
  "room:heartbeat": (
    payload: { roomId: string; sentAt: string; connectionQuality?: ConnectionQuality },
    ack?: (response: HeartbeatAckPayload) => void
  ) => void;
  "room:quality": (payload: { roomId: string; connectionQuality: ConnectionQuality }) => void;
}

export interface SocketServerToClientEvents {
  "presence:join": (payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "presence:leave": (payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "room:presence": (payload: RoomPresencePayload) => void;
  "room:state": (payload: RealtimeRoomState) => void;
  "chat:message": (
    payload: {
      roomId?: string;
      messageId?: string;
      text?: string;
      at?: string;
      userId?: string;
      author?: string;
      clientId?: string;
    }
  ) => void;
  "classroom:sync": (payload: { roomId: string; state: unknown; revision?: number; clientId?: string }) => void;
  "room:heartbeat:ack": (payload: HeartbeatAckPayload) => void;
  "room:error": (payload: { roomId: string; message: string; code?: string }) => void;
}

export const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createOptimisticMessage = (input: {
  roomId: string;
  messageId: string;
  text: string;
  author: string;
  at: string;
  userId?: string;
  clientId?: string;
  mine?: boolean;
  system?: boolean;
  status?: RealtimeChatMessage["status"];
}): RealtimeChatMessage => ({
  id: input.messageId,
  messageId: input.messageId,
  roomId: input.roomId,
  text: input.text,
  author: input.author,
  at: input.at,
  userId: input.userId,
  clientId: input.clientId,
  mine: input.mine ?? true,
  system: input.system,
  status: input.status ?? "pending",
});

export const normalizeIncomingMessage = (
  payload: {
    roomId?: string;
    messageId?: string;
    text?: string;
    at?: string;
    userId?: string;
    author?: string;
    clientId?: string;
  },
  currentUserId?: string
): RealtimeChatMessage | null => {
  if (!payload.roomId || !payload.messageId || !payload.text) return null;

  return {
    id: payload.messageId,
    messageId: payload.messageId,
    roomId: payload.roomId,
    text: payload.text,
    author: payload.author ?? (payload.userId && payload.userId === currentUserId ? "You" : "Participant"),
    at: payload.at ?? new Date().toISOString(),
    userId: payload.userId,
    clientId: payload.clientId,
    mine: payload.userId === currentUserId,
    status: "delivered",
  };
};

export const upsertChatMessage = (
  messages: RealtimeChatMessage[],
  next: RealtimeChatMessage
): RealtimeChatMessage[] => {
  const index = messages.findIndex((message) => message.messageId === next.messageId);
  if (index === -1) return [...messages, next];

  const copy = [...messages];
  copy[index] = { ...copy[index], ...next };
  return copy;
};

export const createSystemEvent = (title: string, detail: string): RealtimeSystemEvent => ({
  id: createMessageId(),
  title,
  detail,
  at: new Date().toISOString(),
});

export const getConnectionQuality = (): ConnectionQuality => {
  if (typeof navigator === "undefined") return "good";
  if (!navigator.onLine) return "offline";

  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number };
  }).connection;

  if (!connection) return "good";

  const effectiveType = connection.effectiveType ?? "";
  const downlink = connection.downlink ?? 10;

  if (effectiveType.includes("2g") || downlink < 0.8) return "poor";
  if (effectiveType === "3g" || downlink < 1.5) return "fair";
  if (downlink < 5) return "good";
  return "excellent";
};

export const storageKeyForRoom = (roomId: string) => `ethiotech:realtime:outbox:${roomId}`;
