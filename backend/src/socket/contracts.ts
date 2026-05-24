export type RealtimeRoomType = "classroom" | "squad" | "generic";

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export interface RoomPresencePayload {
  roomId: string;
  count: number;
  updatedAt: string;
}

export interface RoomStatePayload {
  roomId: string;
  roomType: RealtimeRoomType;
  onlineCount: number;
  connectedUserIds: string[];
  lastActivityAt: string;
  messageCount: number;
  connectionQuality: ConnectionQuality;
}

export interface ChatMessageClientPayload {
  roomId: string;
  messageId: string;
  text: string;
  at: string;
  clientId?: string;
}

export interface ChatMessageServerPayload {
  roomId: string;
  messageId: string;
  text: string;
  at: string;
  userId?: string;
  author?: string;
  clientId?: string;
}

export interface ClassroomSyncPayload {
  roomId: string;
  state: unknown;
  revision?: number;
  clientId?: string;
}

export interface HeartbeatPayload {
  roomId: string;
  sentAt: string;
  connectionQuality?: ConnectionQuality;
}

export interface HeartbeatAckPayload {
  roomId: string;
  receivedAt: string;
  serverTime: string;
  lagMs: number;
}

export interface SocketClientToServerEvents {
  "join-room": (_roomId: string) => void;
  "leave-room": (_roomId: string) => void;
  "chat:message": (_payload: ChatMessageClientPayload, _ack?: (_response: { ok: boolean; messageId?: string }) => void) => void;
  "classroom:sync": (_payload: ClassroomSyncPayload) => void;
  "room:heartbeat": (_payload: HeartbeatPayload, _ack?: (_response: HeartbeatAckPayload) => void) => void;
  "room:quality": (_payload: { roomId: string; connectionQuality: ConnectionQuality }) => void;
}

export interface SocketServerToClientEvents {
  "presence:join": (_payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "presence:leave": (_payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "room:presence": (_payload: RoomPresencePayload) => void;
  "room:state": (_payload: RoomStatePayload) => void;
  "chat:message": (_payload: ChatMessageServerPayload) => void;
  "classroom:sync": (_payload: ClassroomSyncPayload) => void;
  "room:heartbeat:ack": (_payload: HeartbeatAckPayload) => void;
  "room:error": (_payload: { roomId: string; message: string; code?: string }) => void;
}

