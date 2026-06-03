export type RealtimeRoomType = "classroom" | "squad" | "generic";

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export type ParticipantStatus = "active" | "idle" | "disconnected" | "reconnected" | "speaking" | "hand_raised";
export type ParticipantRole = "host" | "cohost" | "moderator" | "participant" | "observer";
export type QuestionStatus = "pending" | "answering" | "answered" | "archived";
export type PollStatus = "active" | "closed" | "results_published";
export type MessageType = "public" | "announcement" | "direct" | "private_question" | "system";

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
  participantCount: number;
  waitingCount: number;
  raisedHandsCount: number;
  questionsWaiting: number;
  activePollCount: number;
}

export interface ChatMessageClientPayload {
  roomId: string;
  messageId: string;
  text: string;
  at: string;
  clientId?: string;
  type?: MessageType;
  recipientId?: string;
}

export interface ChatMessageServerPayload {
  roomId: string;
  messageId: string;
  text: string;
  at: string;
  userId?: string;
  author?: string;
  clientId?: string;
  type?: MessageType;
  recipientId?: string;
  system?: boolean;
  announcement?: boolean;
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

export interface ParticipantControlPayload {
  roomId: string;
  targetUserId: string;
  action: "muted" | "unmuted" | "removed" | "blocked" | "promoted" | "demoted" | "speaking_granted" | "speaking_removed";
  performedBy: string;
  at: string;
}

export interface HandRaisePayload {
  roomId: string;
  userId: string;
  userName: string;
  status: "raised" | "lowered" | "called_on" | "answered";
  queuePosition?: number;
  at: string;
}

export interface QuestionPayload {
  roomId: string;
  questionId: string;
  userId: string;
  userName: string;
  text: string;
  status: QuestionStatus;
  upvoteCount: number;
  isPinned: boolean;
  at: string;
}

export interface PollPayload {
  roomId: string;
  pollId: string;
  question: string;
  type: "single" | "multiple" | "true_false";
  status: PollStatus;
  options: Array<{ text: string; voteCount: number; percentage: number }>;
  totalVotes: number;
  at: string;
}

export interface EngagementPayload {
  roomId: string;
  userId: string;
  score: number;
  details: Record<string, number>;
  at: string;
}

export interface AdmissionPayload {
  roomId: string;
  userId: string;
  action: "admitted" | "denied" | "waiting" | "admitted_all";
  performedBy: string;
  at: string;
}

export interface RoomOverviewPayload {
  roomId: string;
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

export interface VideoStatePayload {
  roomId: string;
  activeSpeakers: string[];
  screenShareUserId?: string;
  screenShareActive: boolean;
}

export interface WhiteboardOpPayload {
  roomId: string;
  opId: string;
  type: "pen" | "eraser" | "rect" | "circle" | "text" | "line" | "fill" | "clear";
  points?: Array<{ x: number; y: number }>;
  color?: string;
  width?: number;
  text?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface BreakoutPayload {
  roomId: string;
  breakoutId: string;
  name: string;
  maxParticipants: number;
  timerSeconds: number;
  status: "created" | "active" | "closed";
  participantCount: number;
}

export interface BreakoutAssignmentPayload {
  roomId: string;
  breakoutId: string;
  participants: Array<{ userId: string; userName: string }>;
}

export interface DMPayload {
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  messageId: string;
  at: string;
}

export interface NotificationPayload {
  userId: string;
  notificationId: string;
  type: "session" | "assignment" | "feedback" | "achievement" | "dm" | "system";
  title: string;
  body: string;
  link?: string;
  at: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
  at: string;
}

export interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  readAt: string;
  messageIds: string[];
}

export interface SocketClientToServerEvents {
  "join-room": (_roomId: string) => void;
  "leave-room": (_roomId: string) => void;
  "chat:message": (_payload: ChatMessageClientPayload, _ack?: (_response: { ok: boolean; messageId?: string }) => void) => void;
  "classroom:sync": (_payload: ClassroomSyncPayload) => void;
  "room:heartbeat": (_payload: HeartbeatPayload, _ack?: (_response: HeartbeatAckPayload) => void) => void;
  "room:quality": (_payload: { roomId: string; connectionQuality: ConnectionQuality }) => void;
  "hand:raise": (_payload: { roomId: string }) => void;
  "hand:lower": (_payload: { roomId: string }) => void;
  "question:submit": (_payload: { roomId: string; questionId: string; text: string }) => void;
  "question:upvote": (_payload: { roomId: string; questionId: string }) => void;
  "poll:vote": (_payload: { roomId: string; pollId: string; optionIndex: number }) => void;
  "participant:control": (_payload: { roomId: string; targetUserId: string; action: string; reason?: string }) => void;
  "admission:action": (_payload: { roomId: string; targetUserId: string; action: "admit" | "deny" }) => void;
  "admission:admit-all": (_payload: { roomId: string }) => void;
  "mentor:request-overview": (_payload: { roomId: string }) => void;
  "video:toggle-audio": (_payload: { roomId: string; enabled: boolean }) => void;
  "video:toggle-video": (_payload: { roomId: string; enabled: boolean }) => void;
  "video:screen-share:start": (_payload: { roomId: string }) => void;
  "video:screen-share:stop": (_payload: { roomId: string }) => void;
  "whiteboard:draw": (_payload: WhiteboardOpPayload) => void;
  "whiteboard:clear": (_payload: { roomId: string }) => void;
  "whiteboard:undo": (_payload: { roomId: string }) => void;
  "dm:send": (_payload: { conversationId: string; text: string }) => void;
  "dm:typing-start": (_payload: { conversationId: string }) => void;
  "dm:typing-stop": (_payload: { conversationId: string }) => void;
  "dm:read": (_payload: { conversationId: string }) => void;
  "notification:read": (_payload: { notificationId: string }) => void;
}

export interface SocketServerToClientEvents {
  "presence:join": (_payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "presence:leave": (_payload: { roomId: string; userId?: string; socketId: string; at: string }) => void;
  "room:presence": (_payload: RoomPresencePayload) => void;
  "room:state": (_payload: RoomStatePayload) => void;
  "room:overview": (_payload: RoomOverviewPayload) => void;
  "chat:message": (_payload: ChatMessageServerPayload) => void;
  "chat:message:deleted": (_payload: { roomId: string; messageId: string }) => void;
  "chat:moderation": (_payload: { roomId: string; action: string; targetUserId: string; reason?: string }) => void;
  "classroom:sync": (_payload: ClassroomSyncPayload) => void;
  "room:heartbeat:ack": (_payload: HeartbeatAckPayload) => void;
  "room:error": (_payload: { roomId: string; message: string; code?: string }) => void;
  "hand:raised": (_payload: HandRaisePayload) => void;
  "hand:lowered": (_payload: HandRaisePayload) => void;
  "hand:called-on": (_payload: HandRaisePayload) => void;
  "hand:queue": (_payload: { roomId: string; queue: Array<{ userId: string; userName: string; queuePosition: number }> }) => void;
  "question:new": (_payload: QuestionPayload) => void;
  "question:updated": (_payload: QuestionPayload) => void;
  "question:deleted": (_payload: { roomId: string; questionId: string }) => void;
  "poll:created": (_payload: PollPayload) => void;
  "poll:updated": (_payload: PollPayload) => void;
  "poll:results": (_payload: PollPayload) => void;
  "engagement:updated": (_payload: EngagementPayload) => void;
  "participant:control": (_payload: ParticipantControlPayload) => void;
  "participant:status": (_payload: { roomId: string; userId: string; status: ParticipantStatus }) => void;
  "admission:update": (_payload: AdmissionPayload) => void;
  "waiting:queue": (_payload: { roomId: string; queue: Array<{ userId: string; userName: string; joinedAt: string }> }) => void;
  "notification:mentor": (_payload: { roomId: string; type: string; message: string; data?: unknown }) => void;
  "video:state": (_payload: VideoStatePayload) => void;
  "video:audio-toggled": (_payload: { roomId: string; userId: string; enabled: boolean }) => void;
  "video:video-toggled": (_payload: { roomId: string; userId: string; enabled: boolean }) => void;
  "video:screen-share:started": (_payload: { roomId: string; userId: string }) => void;
  "video:screen-share:stopped": (_payload: { roomId: string }) => void;
  "video:recording:started": (_payload: { roomId: string; by: string }) => void;
  "video:recording:stopped": (_payload: { roomId: string }) => void;
  "whiteboard:draw": (_payload: WhiteboardOpPayload) => void;
  "whiteboard:clear": (_payload: { roomId: string }) => void;
  "whiteboard:history": (_payload: { roomId: string; ops: WhiteboardOpPayload[] }) => void;
  "breakout:created": (_payload: BreakoutPayload) => void;
  "breakout:updated": (_payload: BreakoutPayload) => void;
  "breakout:closed": (_payload: { roomId: string; breakoutId: string }) => void;
  "breakout:participants": (_payload: BreakoutAssignmentPayload) => void;
  "breakout:timer": (_payload: { roomId: string; breakoutId: string; endsAt: string }) => void;
  "dm:new": (_payload: DMPayload) => void;
  "dm:typing": (_payload: TypingPayload) => void;
  "dm:read-receipt": (_payload: ReadReceiptPayload) => void;
  "notification:new": (_payload: NotificationPayload) => void;
  "notification:count": (_payload: { userId: string; count: number }) => void;
}

