import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { canUserJoinRoom, parseRoomId } from "./roomAuth.js";
import ChatMessage from "../models/ChatMessage.js";
import PeerGroup from "../models/PeerGroup.js";
import User from "../models/User.js";
import type {
  ChatMessageClientPayload,
  ClassroomSyncPayload,
  ConnectionQuality,
  HeartbeatPayload,
  RealtimeRoomType,
  RoomPresencePayload,
  RoomStatePayload,
} from "./contracts.js";

interface SocketUser {
  id: string;
  role: string;
  displayName?: string;
}

interface RoomState {
  roomId: string;
  roomType: RealtimeRoomType;
  connectedParticipants: Map<string, string | undefined>;
  lastActivityAt: string;
  messageCount: number;
  connectionQuality: ConnectionQuality;
}

const ROOM_RETENTION_MS = 15 * 60 * 1000;
const ROOM_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 1000;
const CHAT_EVENTS_PER_WINDOW = 12;
const SYNC_EVENTS_PER_WINDOW = 45;
const HEARTBEATS_PER_WINDOW = 10;
const MAX_ROOM_ID_LENGTH = 96;
const MAX_CHAT_TEXT_LENGTH = 1200;
const MAX_SYNC_PAYLOAD_BYTES = 32 * 1024;
const ROOM_ID_PATTERN = /^[a-z][a-z0-9-]*$/i;
const MAX_CONNECTIONS_PER_USER = 5;

const rooms = new Map<string, RoomState>();
const userConnectionCounts = new Map<string, number>();

const isValidRoomId = (roomId: unknown): roomId is string =>
  typeof roomId === "string" &&
  roomId.length > 0 &&
  roomId.length <= MAX_ROOM_ID_LENGTH &&
  ROOM_ID_PATTERN.test(roomId);

const sanitizeChatText = (text: string) =>
  Array.from(text)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join("")
    .trim();

const payloadSize = (payload: unknown) => {
  try {
    return Buffer.byteLength(JSON.stringify(payload), "utf8");
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

const consumeBudget = (
  socket: Socket,
  bucketName: string,
  maxEvents: number
) => {
  const now = Date.now();
  socket.data.rateLimits ??= {};
  const bucket = socket.data.rateLimits[bucketName] as { startedAt: number; count: number } | undefined;

  if (!bucket || now - bucket.startedAt > RATE_LIMIT_WINDOW_MS) {
    socket.data.rateLimits[bucketName] = { startedAt: now, count: 1 };
    return true;
  }

  if (bucket.count >= maxEvents) {
    return false;
  }

  bucket.count += 1;
  return true;
};

const getRoomType = (roomId: string): RealtimeRoomType => {
  if (roomId.startsWith("classroom-") || roomId.startsWith("session-")) return "classroom";
  if (roomId.startsWith("squad-") || roomId.startsWith("peer-")) return "squad";
  return "generic";
};

const getRoomState = (roomId: string): RoomState => {
  const existing = rooms.get(roomId);
  if (existing) return existing;

  const created: RoomState = {
    roomId,
    roomType: getRoomType(roomId),
    connectedParticipants: new Map<string, string | undefined>(),
    lastActivityAt: new Date().toISOString(),
    messageCount: 0,
    connectionQuality: "good",
  };
  rooms.set(roomId, created);
  return created;
};

const snapshotRoom = (io: Server, roomId: string): RoomStatePayload => {
  const state = getRoomState(roomId);
  const onlineCount = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
  return {
    roomId,
    roomType: state.roomType,
    onlineCount,
    connectedUserIds: Array.from(
      new Set([...state.connectedParticipants.values()].filter((value): value is string => Boolean(value)))
    ),
    lastActivityAt: state.lastActivityAt,
    messageCount: state.messageCount,
    connectionQuality: state.connectionQuality,
  };
};

const emitRoomState = (io: Server, roomId: string) => {
  const snapshot = snapshotRoom(io, roomId);
  const presence: RoomPresencePayload = {
    roomId,
    count: snapshot.onlineCount,
    updatedAt: snapshot.lastActivityAt,
  };
  io.to(roomId).emit("room:presence", presence);
  io.to(roomId).emit("room:state", snapshot);
};

const updateRoomActivity = (
  io: Server,
  roomId: string,
  quality?: ConnectionQuality,
  broadcast = true
) => {
  const state = getRoomState(roomId);
  state.lastActivityAt = new Date().toISOString();
  if (quality) state.connectionQuality = quality;
  if (broadcast) {
   emitRoomState(io, roomId);
  }
};

const cleanupRooms = () => {
  const now = Date.now();
  for (const [roomId, state] of rooms.entries()) {
    if (state.connectedParticipants.size > 0) continue;
    if (now - new Date(state.lastActivityAt).getTime() < ROOM_RETENTION_MS) continue;
    rooms.delete(roomId);
  }
};

export const setupSocket = (io: Server) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    try {
      const payload = jwt.verify(token, getEnv().jwtSecret) as SocketUser;
      const dbUser = await User.findById(payload.id).select("fullName role").lean();
      if (!dbUser) {
        return next(new Error("Unauthorized"));
      }

      // S6: Per-user connection limit to prevent DoS
      const currentCount = userConnectionCounts.get(payload.id) ?? 0;
      if (currentCount >= MAX_CONNECTIONS_PER_USER) {
        return next(new Error("Too many connections"));
      }
      userConnectionCounts.set(payload.id, currentCount + 1);

      socket.data.user = {
        id: payload.id,
        role: dbUser.role ?? payload.role,
        displayName: dbUser.fullName ?? "Learner",
      };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser | undefined;
    const joinedRooms = new Set<string>();
    logger.info("Socket connected", { socketId: socket.id, userId: user?.id });

    socket.on("join-room", async (roomId: string) => {
      if (!isValidRoomId(roomId)) {
        socket.emit("room:error", { roomId: "unknown", message: "Invalid room id", code: "invalid_room" });
        return;
      }

      let allowed = false;
      try {
        allowed = await canUserJoinRoom(roomId, user);
      } catch (error) {
        logger.warn("Socket room authorization failed", { roomId, userId: user?.id, error });
      }
      if (!allowed) {
        socket.emit("room:error", {
          roomId,
          message: "You do not have access to this room",
          code: "forbidden",
        });
        return;
      }

      socket.join(roomId);
      joinedRooms.add(roomId);
      const state = getRoomState(roomId);
      state.connectedParticipants.set(socket.id, user?.id);
      socket.to(roomId).emit("presence:join", {
        roomId,
        userId: user?.id,
        socketId: socket.id,
        at: new Date().toISOString(),
      });
      updateRoomActivity(io, roomId);
    });

    socket.on("leave-room", (roomId: string) => {
      if (!roomId || !joinedRooms.has(roomId)) return;
      socket.leave(roomId);
      joinedRooms.delete(roomId);
      const state = rooms.get(roomId);
      if (state) {
        state.connectedParticipants.delete(socket.id);
      }
      socket.to(roomId).emit("presence:leave", {
        roomId,
        userId: user?.id,
        socketId: socket.id,
        at: new Date().toISOString(),
      });
      updateRoomActivity(io, roomId);
    });

    socket.on("chat:message", (payload: ChatMessageClientPayload, ack?: (_response: { ok: boolean; messageId?: string }) => void) => {
      if (!consumeBudget(socket, "chat", CHAT_EVENTS_PER_WINDOW)) {
        socket.emit("room:error", {
          roomId: payload?.roomId ?? "unknown",
          message: "Message rate limit exceeded",
          code: "rate_limited",
        });
        ack?.({ ok: false });
        return;
      }

      const sanitizedText = typeof payload?.text === "string" ? sanitizeChatText(payload.text) : "";
      if (!isValidRoomId(payload?.roomId) || !sanitizedText) {
        socket.emit("room:error", {
          roomId: payload?.roomId ?? "unknown",
          message: "Message text is required",
          code: "invalid_message",
        });
        ack?.({ ok: false });
        return;
      }

      if (sanitizedText.length > MAX_CHAT_TEXT_LENGTH) {
        socket.emit("room:error", {
          roomId: payload.roomId,
          message: `Message must be ${MAX_CHAT_TEXT_LENGTH} characters or fewer`,
          code: "message_too_long",
        });
        ack?.({ ok: false });
        return;
      }

      const roomId = payload.roomId;
      if (!joinedRooms.has(roomId)) {
        socket.emit("room:error", {
          roomId,
          message: "Join the room before sending messages",
          code: "not_in_room",
        });
        ack?.({ ok: false });
        return;
      }
      const roomState = getRoomState(roomId);
      roomState.messageCount += 1;
      updateRoomActivity(io, roomId);

      const serverPayload = {
        roomId,
        messageId: payload.messageId,
        text: sanitizedText,
        at: payload.at ?? new Date().toISOString(),
        userId: user?.id,
        author: user?.displayName ?? (user?.id ? `User ${user.id.slice(0, 6)}` : "Participant"),
        clientId: payload.clientId,
      };

      io.to(roomId).emit("chat:message", serverPayload);
      ChatMessage.create({
        roomId,
        userId: user?.id,
        text: sanitizeChatText(serverPayload.text).replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        messageId: payload.messageId,
      }).catch(() => {});

      const { type, resourceId } = parseRoomId(roomId);
      if ((type === "squad" || type === "peer") && resourceId) {
        PeerGroup.findByIdAndUpdate(resourceId, { $inc: { groupXP: 2 } }).catch(() => {});
      }

      ack?.({ ok: true, messageId: payload.messageId });
    });

    socket.on("classroom:sync", (payload: ClassroomSyncPayload) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!consumeBudget(socket, "sync", SYNC_EVENTS_PER_WINDOW)) {
        socket.emit("room:error", {
          roomId: payload.roomId,
          message: "Sync rate limit exceeded",
          code: "rate_limited",
        });
        return;
      }
      if (payloadSize(payload) > MAX_SYNC_PAYLOAD_BYTES) {
        socket.emit("room:error", {
          roomId: payload.roomId,
          message: "Sync payload is too large",
          code: "payload_too_large",
        });
        return;
      }
      if (!joinedRooms.has(payload.roomId)) {
        socket.emit("room:error", {
          roomId: payload.roomId,
          message: "Join the room before syncing",
          code: "not_in_room",
        });
        return;
      }
      updateRoomActivity(io, payload.roomId);
      socket.to(payload.roomId).emit("classroom:sync", payload);
    });

    socket.on("room:heartbeat", (payload: HeartbeatPayload, ack?: (_response: { roomId: string; receivedAt: string; serverTime: string; lagMs: number }) => void) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!consumeBudget(socket, "heartbeat", HEARTBEATS_PER_WINDOW)) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const receivedAt = new Date().toISOString();
      const sentAtMs = Date.parse(payload.sentAt);
      updateRoomActivity(io, payload.roomId, payload.connectionQuality, false);
      const response = {
        roomId: payload.roomId,
        receivedAt,
        serverTime: receivedAt,
        lagMs: Number.isFinite(sentAtMs) ? Math.max(0, Date.now() - sentAtMs) : 0,
      };
      ack?.(response);
      socket.emit("room:heartbeat:ack", response);
    });

    socket.on("room:quality", (payload: { roomId: string; connectionQuality: ConnectionQuality }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const state = getRoomState(payload.roomId);
      state.connectionQuality = payload.connectionQuality;
      updateRoomActivity(io, payload.roomId, payload.connectionQuality, false);
    });

    socket.on("disconnect", () => {
      // Decrement per-user connection count
      if (user?.id) {
        const count = userConnectionCounts.get(user.id) ?? 1;
        if (count <= 1) {
          userConnectionCounts.delete(user.id);
        } else {
          userConnectionCounts.set(user.id, count - 1);
        }
      }

      for (const roomId of joinedRooms) {
        const state = rooms.get(roomId);
        if (state) {
          state.connectedParticipants.delete(socket.id);
        }
        socket.to(roomId).emit("presence:leave", {
          roomId,
          userId: user?.id,
          socketId: socket.id,
          at: new Date().toISOString(),
        });
        updateRoomActivity(io, roomId);
      }
      joinedRooms.clear();
      logger.info("Socket disconnected", { socketId: socket.id, userId: user?.id });
    });
  });

  const cleanupTimer = setInterval(cleanupRooms, ROOM_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
};
