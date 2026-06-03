export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export type MessageType = "public" | "announcement" | "direct" | "private_question" | "system";

export type ParticipantStatus = "active" | "idle" | "disconnected" | "reconnected" | "speaking" | "hand_raised";

export interface RealtimeRoomState {
  roomId: string;
  roomType: "classroom" | "squad" | "generic";
  onlineCount: number;
  connectedUserIds: string[];
  lastActivityAt: string;
  messageCount: number;
  connectionQuality: ConnectionQuality;
  participantCount?: number;
  waitingCount?: number;
  raisedHandsCount?: number;
  questionsWaiting?: number;
  activePollCount?: number;
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
  announcement?: boolean;
  type?: MessageType;
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
  queuedAt?: string;
  type?: MessageType;
  recipientId?: string;
}

export interface MentorOverview {
  participantCount: number;
  waitingCount: number;
  sessionDuration: string;
  attendancePercent: number;
  engagementScore: number;
  questionsWaiting: number;
  raisedHands: number;
  activePolls: number;
  chatActivity: number;
}

export interface RaisedHandEntry {
  userId: string;
  userName: string;
  queuePosition?: number;
  raisedAt?: string;
}

export interface QuestionEntry {
  questionId: string;
  userId: string;
  userName: string;
  text: string;
  status: "pending" | "answering" | "answered" | "archived";
  upvoteCount: number;
  isPinned: boolean;
  at: string;
}

export interface PollEntry {
  pollId: string;
  question: string;
  type: "single" | "multiple" | "true_false";
  status: "active" | "closed" | "results_published";
  options: Array<{ text: string; voteCount: number; percentage: number }>;
  totalVotes: number;
  at: string;
}

export interface WaitingUserEntry {
  userId: string;
  userName: string;
  joinedAt: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  at: string; // empty string means typing stopped
}

export interface ReadReceipt {
  conversationId: string;
  userId: string;
  readAt: string;
  messageIds: string[];
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
  "hand:raise": (payload: { roomId: string }) => void;
  "hand:lower": (payload: { roomId: string }) => void;
  "question:submit": (payload: { roomId: string; questionId: string; text: string }) => void;
  "question:upvote": (payload: { roomId: string; questionId: string }) => void;
  "poll:vote": (payload: { roomId: string; pollId: string; optionIndex: number }) => void;
  "participant:control": (payload: { roomId: string; targetUserId: string; action: string; reason?: string }) => void;
  "admission:action": (payload: { roomId: string; targetUserId: string; action: "admit" | "deny" }) => void;
  "admission:admit-all": (payload: { roomId: string }) => void;
  "mentor:request-overview": (payload: { roomId: string }) => void;
  "video:toggle-audio": (payload: { roomId: string; enabled: boolean }) => void;
  "video:toggle-video": (payload: { roomId: string; enabled: boolean }) => void;
  "video:screen-share:start": (payload: { roomId: string }) => void;
  "video:screen-share:stop": (payload: { roomId: string }) => void;
  "whiteboard:draw": (payload: { roomId: string; opId: string; type: string; points?: Array<{ x: number; y: number }>; color?: string; width?: number; text?: string; x?: number; y?: number; w?: number; h?: number }) => void;
  "whiteboard:clear": (payload: { roomId: string }) => void;
  "whiteboard:undo": (payload: { roomId: string; opId?: string }) => void;
  "dm:send": (payload: { conversationId: string; text: string }) => void;
  "dm:typing-start": (payload: { conversationId: string }) => void;
  "dm:typing-stop": (payload: { conversationId: string }) => void;
  "dm:read": (payload: { conversationId: string }) => void;
  "notification:read": (payload: { notificationId: string }) => void;
}

export interface SocketServerToClientEvents {
  "presence:join": (payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "presence:leave": (payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "room:presence": (payload: RoomPresencePayload) => void;
  "room:state": (payload: RealtimeRoomState) => void;
  "room:overview": (payload: MentorOverview) => void;
  "user:avatar:updated": (payload: { userId: string; avatarUrl: string; avatarType?: "uploaded" | "default"; avatarSource?: "cloudinary" | "system"; updatedAt: string }) => void;
  "chat:message": (payload: { roomId?: string; messageId?: string; text?: string; at?: string; userId?: string; author?: string; clientId?: string; type?: MessageType; system?: boolean; announcement?: boolean; recipientId?: string }) => void;
  "chat:message:deleted": (payload: { roomId: string; messageId: string }) => void;
  "chat:moderation": (payload: { roomId: string; action: string; targetUserId: string; reason?: string }) => void;
  "classroom:sync": (payload: { roomId: string; state: unknown; revision?: number; clientId?: string }) => void;
  "room:heartbeat:ack": (payload: HeartbeatAckPayload) => void;
  "room:error": (payload: { roomId: string; message: string; code?: string }) => void;
  "hand:raised": (payload: { roomId: string; userId: string; userName: string; status: string; queuePosition?: number; at: string }) => void;
  "hand:lowered": (payload: { roomId: string; userId: string; userName: string; status: string; at: string }) => void;
  "hand:queue": (payload: { roomId: string; queue: Array<{ userId: string; userName: string; queuePosition?: number }> }) => void;
  "hand:called-on": (payload: { roomId: string; userId: string; userName: string; status: string; at: string }) => void;
  "question:new": (payload: { roomId: string; questionId: string; userId: string; userName: string; text: string; status: string; upvoteCount: number; isPinned: boolean; at: string }) => void;
  "question:updated": (payload: { roomId: string; questionId: string; userId: string; userName: string; text: string; status: string; upvoteCount: number; isPinned: boolean; at: string }) => void;
  "question:deleted": (payload: { roomId: string; questionId: string }) => void;
  "poll:created": (payload: { roomId: string; pollId: string; question: string; type: string; status: string; options: Array<{ text: string; voteCount: number; percentage: number }>; totalVotes: number; at: string }) => void;
  "poll:updated": (payload: { roomId: string; pollId: string; question: string; type: string; status: string; options: Array<{ text: string; voteCount: number; percentage: number }>; totalVotes: number; at: string }) => void;
  "poll:results": (payload: { roomId: string; pollId: string; question: string; type: string; status: string; options: Array<{ text: string; voteCount: number; percentage: number }>; totalVotes: number; at: string }) => void;
  "engagement:updated": (payload: { roomId: string; userId: string; score: number; details: Record<string, number>; at: string }) => void;
  "participant:control": (payload: { roomId: string; targetUserId: string; action: string; performedBy: string; at: string }) => void;
  "participant:status": (payload: { roomId: string; userId: string; status: ParticipantStatus }) => void;
  "admission:update": (payload: { roomId: string; userId: string; action: string; performedBy: string; at: string }) => void;
  "waiting:queue": (payload: { roomId: string; queue: Array<{ userId: string; userName: string; joinedAt: string }> }) => void;
  "notification:mentor": (payload: { roomId: string; type: string; message: string; data?: unknown }) => void;
  "video:state": (payload: { roomId: string; activeSpeakers: string[]; screenShareUserId?: string; screenShareActive: boolean }) => void;
  "video:audio-toggled": (payload: { roomId: string; userId: string; enabled: boolean }) => void;
  "video:video-toggled": (payload: { roomId: string; userId: string; enabled: boolean }) => void;
  "video:screen-share:started": (payload: { roomId: string; userId: string }) => void;
  "video:screen-share:stopped": (payload: { roomId: string }) => void;
  "video:recording:started": (payload: { roomId: string; by: string }) => void;
  "video:recording:stopped": (payload: { roomId: string }) => void;
  "whiteboard:draw": (payload: { roomId: string; opId: string; type: string; points?: Array<{ x: number; y: number }>; color?: string; width?: number; text?: string; x?: number; y?: number; w?: number; h?: number }) => void;
  "whiteboard:clear": (payload: { roomId: string }) => void;
  "whiteboard:history": (payload: { roomId: string; ops: unknown[] }) => void;
  "breakout:created": (payload: { roomId: string; breakoutId: string; name: string; maxParticipants: number; timerSeconds: number; status: string; participantCount: number }) => void;
  "breakout:updated": (payload: { roomId: string; breakoutId: string; name: string; maxParticipants: number; timerSeconds: number; status: string; participantCount: number }) => void;
  "breakout:closed": (payload: { roomId: string; breakoutId: string }) => void;
  "breakout:participants": (payload: { roomId: string; breakoutId: string; participants: Array<{ userId: string; userName: string }> }) => void;
  "breakout:timer": (payload: { roomId: string; breakoutId: string; endsAt: string }) => void;
  "dm:new": (payload: { conversationId: string; senderId: string; senderName: string; text: string; messageId: string; at: string }) => void;
  "dm:typing": (payload: TypingIndicator) => void;
  "dm:read-receipt": (payload: ReadReceipt) => void;
  "notification:new": (payload: { userId: string; notificationId: string; type: string; title: string; body: string; link?: string; at: string }) => void;
  "notification:count": (payload: { userId: string; count: number }) => void;
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
