import type { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { canUserJoinRoom, parseRoomId } from "./roomAuth.js";
import ChatMessage from "../models/ChatMessage.js";
import PeerGroup from "../models/PeerGroup.js";
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

const rooms = new Map<string, RoomState>();

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

const updateRoomActivity = (io: Server, roomId: string, quality?: ConnectionQuality) => {
  const state = getRoomState(roomId);
  state.lastActivityAt = new Date().toISOString();
  if (quality) state.connectionQuality = quality;
  emitRoomState(io, roomId);
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
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    try {
      const payload = jwt.verify(token, getEnv().jwtSecret) as SocketUser;
      socket.data.user = payload;
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
      if (!roomId || typeof roomId !== "string") {
        socket.emit("room:error", { roomId: "unknown", message: "Invalid room id", code: "invalid_room" });
        return;
      }

      const allowed = await canUserJoinRoom(roomId, user);
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
      updateRoomActivity(io, roomId);
      socket.to(roomId).emit("presence:join", {
        roomId,
        userId: user?.id,
        socketId: socket.id,
        at: new Date().toISOString(),
      });
      socket.emit("room:state", snapshotRoom(io, roomId));
      emitRoomState(io, roomId);
    });

    socket.on("leave-room", (roomId: string) => {
      if (!roomId || !joinedRooms.has(roomId)) return;
      socket.leave(roomId);
      joinedRooms.delete(roomId);
      const state = rooms.get(roomId);
      if (state) {
        state.connectedParticipants.delete(socket.id);
        updateRoomActivity(io, roomId);
      }
      socket.to(roomId).emit("presence:leave", {
        roomId,
        userId: user?.id,
        socketId: socket.id,
        at: new Date().toISOString(),
      });
      emitRoomState(io, roomId);
    });

    socket.on("chat:message", (payload: ChatMessageClientPayload, ack?: (_response: { ok: boolean; messageId?: string }) => void) => {
      if (!payload?.roomId || !payload?.text?.trim()) {
        socket.emit("room:error", {
          roomId: payload?.roomId ?? "unknown",
          message: "Message text is required",
          code: "invalid_message",
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
        text: payload.text.trim(),
        at: payload.at ?? new Date().toISOString(),
        userId: user?.id,
        author: user?.id ? `User ${user.id.slice(0, 6)}` : "Participant",
        clientId: payload.clientId,
      };

      io.to(roomId).emit("chat:message", serverPayload);
      ChatMessage.create({
        roomId,
        userId: user?.id,
        text: serverPayload.text,
        messageId: payload.messageId,
      }).catch(() => {});

      const { type, resourceId } = parseRoomId(roomId);
      if ((type === "squad" || type === "peer") && resourceId) {
        PeerGroup.findByIdAndUpdate(resourceId, { $inc: { groupXP: 2 } }).catch(() => {});
      }

      ack?.({ ok: true, messageId: payload.messageId });
    });

    socket.on("classroom:sync", (payload: ClassroomSyncPayload) => {
      if (!payload?.roomId) return;
      if (!joinedRooms.has(payload.roomId)) {
        socket.emit("room:error", {
          roomId: payload.roomId,
          message: "Join the room before syncing",
          code: "not_in_room",
        });
        return;
      }
      updateRoomActivity(io, payload.roomId);
      io.to(payload.roomId).emit("classroom:sync", payload);
    });

    socket.on("room:heartbeat", (payload: HeartbeatPayload, ack?: (_response: { roomId: string; receivedAt: string; serverTime: string; lagMs: number }) => void) => {
      if (!payload?.roomId) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const receivedAt = new Date().toISOString();
      updateRoomActivity(io, payload.roomId, payload.connectionQuality);
      const response = {
        roomId: payload.roomId,
        receivedAt,
        serverTime: receivedAt,
        lagMs: Math.max(0, Date.now() - new Date(payload.sentAt).getTime()),
      };
      ack?.(response);
      socket.emit("room:heartbeat:ack", response);
    });

    socket.on("room:quality", (payload: { roomId: string; connectionQuality: ConnectionQuality }) => {
      if (!payload?.roomId) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const state = getRoomState(payload.roomId);
      state.connectionQuality = payload.connectionQuality;
      updateRoomActivity(io, payload.roomId, payload.connectionQuality);
    });

    socket.on("disconnect", () => {
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
