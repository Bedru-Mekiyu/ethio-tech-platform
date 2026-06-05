import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getEnv } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { canUserJoinRoom, parseRoomId } from "./roomAuth.js";
import { recordJoin, recordHeartbeat, recordLeave } from "../services/attendanceService.js";
import { validateLiveAccessToken } from "../services/liveClassroomService.js";
import { setSocketIO } from "../services/notificationHelper.js";
import * as handRaiseService from "../services/handRaiseService.js";
import * as questionService from "../services/sessionQuestionService.js";
import * as pollService from "../services/sessionPollService.js";
import * as moderationService from "../services/moderationService.js";
import * as admissionService from "../services/admissionService.js";
import ChatMessage from "../models/ChatMessage.js";
import PeerGroup from "../models/PeerGroup.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import SessionQuestion from "../models/SessionQuestion.js";
import SessionPoll from "../models/SessionPoll.js";
import type {
  ChatMessageClientPayload,
  ChatMessageServerPayload,
  ClassroomSyncPayload,
  ConnectionQuality,
  HandRaisePayload,
  HeartbeatPayload,
  ParticipantControlPayload,
  PollPayload,
  QuestionPayload,
  RealtimeRoomType,
  RoomPresencePayload,
  RoomStatePayload,
  WhiteboardOpPayload,
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

interface PopulatedUserRef {
  _id?: unknown;
  fullName?: string;
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

const consumeBudget = (socket: Socket, bucketName: string, maxEvents: number) => {
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

const getRefId = (ref: unknown) => {
  if (ref && typeof ref === "object" && "_id" in ref) {
    return String((ref as PopulatedUserRef)._id);
  }
  return String(ref ?? "");
};

const getRefName = (ref: unknown, fallback: string) => {
  if (ref && typeof ref === "object" && "fullName" in ref) {
    return (ref as PopulatedUserRef).fullName || fallback;
  }
  return fallback;
};

const snapshotRoom = (io: Server, roomId: string): RoomStatePayload => {
  const state = getRoomState(roomId);
  const onlineCount = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
  const connectedUserIds = Array.from(
    new Set([...state.connectedParticipants.values()].filter((value): value is string => Boolean(value))),
  );
  return {
    roomId,
    roomType: state.roomType,
    onlineCount,
    connectedUserIds,
    lastActivityAt: state.lastActivityAt,
    messageCount: state.messageCount,
    connectionQuality: state.connectionQuality,
    participantCount: connectedUserIds.length,
    waitingCount: 0,
    raisedHandsCount: 0,
    questionsWaiting: 0,
    activePollCount: 0,
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

const updateRoomActivity = (io: Server, roomId: string, quality?: ConnectionQuality, broadcast = true) => {
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
  setSocketIO(io);
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

  const getUserRole = async (userId: string, sessionId: string) => {
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return "observer";
    }
    const session = await Session.findById(sessionId).select("mentor");
    if (!session) return "observer";
    if (String(session.mentor) === String(userId)) return "host";

    const participant = await SessionParticipant.findOne({ session: sessionId, user: userId }).select("role");
    return participant?.role ?? "observer";
  };

  const sendSystemMessage = async (io: Server, roomId: string, text: string) => {
    const messageId = `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const at = new Date().toISOString();

    const serverPayload: ChatMessageServerPayload = {
      roomId,
      messageId,
      text,
      at,
      userId: "system",
      author: "System",
      system: true,
      type: "system",
    };

    io.to(roomId).emit("chat:message", serverPayload);

    await ChatMessage.create({
      roomId,
      text,
      messageId,
      type: "system",
      isSystem: true,
    }).catch((err) => {
      logger.warn("Failed to save system message to database", { error: err });
    });
  };

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser | undefined;
    const joinedRooms = new Set<string>();
    logger.info("Socket connected", { socketId: socket.id, userId: user?.id });
    if (user?.id) {
      socket.join(`user:${user.id}`);
    }

    socket.on("join-room", async (roomId: string) => {
      if (!isValidRoomId(roomId)) {
        socket.emit("room:error", { roomId: "unknown", message: "Invalid room id", code: "invalid_room" });
        return;
      }

      const { type, resourceId } = parseRoomId(roomId);

      if ((type === "session" || type === "classroom") && resourceId) {
        const liveToken = socket.handshake.auth?.liveAccessToken as string | undefined;
        const validation = await validateLiveAccessToken(liveToken, user?.id);
        if (!validation.valid) {
          logger.warn("Live access token rejected", { roomId, userId: user?.id, reason: validation.reason });
          socket.emit("room:error", {
            roomId,
            message: validation.reason || "Access denied to live classroom",
            code: "forbidden",
          });
          return;
        }
        socket.data.roomRole = validation.role || user?.role;
        socket.join(roomId);
        joinedRooms.add(roomId);
        const state = getRoomState(roomId);
        state.connectedParticipants.set(socket.id, user?.id);

        recordJoin(resourceId, user?.id, socket.handshake.address)
          .then(async () => {
            if (user?.displayName) {
              await sendSystemMessage(io, roomId, `${user.displayName} joined the session`);
            }
          })
          .catch((err) => {
            logger.warn("Failed to record socket join", { roomId, userId: user?.id, error: err });
          });

        socket.to(roomId).emit("presence:join", {
          roomId,
          userId: user?.id,
          socketId: socket.id,
          at: new Date().toISOString(),
        });
        updateRoomActivity(io, roomId);
        return;
      }

      let authResult: { allowed: boolean; role?: string } = { allowed: false };
      try {
        authResult = await canUserJoinRoom(roomId, user);
      } catch (error) {
        logger.warn("Socket room authorization failed", { roomId, userId: user?.id, error });
      }
      if (!authResult.allowed) {
        socket.emit("room:error", {
          roomId,
          message: "You do not have access to this room",
          code: "forbidden",
        });
        return;
      }

      socket.join(roomId);
      joinedRooms.add(roomId);
      socket.data.roomRole = authResult.role;
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

      const { type, resourceId } = parseRoomId(roomId);
      if ((type === "session" || type === "classroom") && resourceId && user?.id) {
        recordLeave(resourceId, user.id, socket.handshake.address)
          .then(async () => {
            if (user?.displayName) {
              await sendSystemMessage(io, roomId, `${user.displayName} left the session`);
            }
          })
          .catch((err) => {
            logger.warn("Failed to record socket leave", { roomId, userId: user.id, error: err });
          });
      }

      socket.to(roomId).emit("presence:leave", {
        roomId,
        userId: user?.id,
        socketId: socket.id,
        at: new Date().toISOString(),
      });
      updateRoomActivity(io, roomId);
    });

    socket.on(
      "chat:message",
      async (payload: ChatMessageClientPayload, ack?: (_response: { ok: boolean; messageId?: string }) => void) => {
        if (socket.data.roomRole === "observer") {
          socket.emit("room:error", {
            roomId: payload?.roomId ?? "unknown",
            message: "Observers cannot send messages",
            code: "forbidden",
          });
          ack?.({ ok: false });
          return;
        }
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

        if (user?.id) {
          if (await moderationService.isUserMuted(roomId.replace("session-", ""), user.id)) {
            socket.emit("room:error", { roomId, message: "You are muted in this session", code: "muted" });
            ack?.({ ok: false });
            return;
          }
          if (await moderationService.isUserTimedOut(user.id, roomId.replace("session-", ""))) {
            socket.emit("room:error", { roomId, message: "You are temporarily timed out", code: "timed_out" });
            ack?.({ ok: false });
            return;
          }
          if (moderationService.checkFlood(user.id)) {
            moderationService
              .timeoutUser({
                sessionId: roomId.replace("session-", ""),
                userId: user.id,
                actorId: user.id,
                durationMinutes: 1,
                reason: "Flood detected",
                ip: socket.handshake.address,
              })
              .catch(() => undefined);
            socket.emit("room:error", {
              roomId,
              message: "Flood detected. You have been timed out for 1 minute.",
              code: "flood_detected",
            });
            ack?.({ ok: false });
            return;
          }
          if (moderationService.checkSpam(sanitizedText)) {
            socket.emit("chat:message", {
              roomId,
              messageId: `spam-warning-${Date.now()}`,
              text: "Your message was blocked by spam detection.",
              at: new Date().toISOString(),
              userId: "system",
              author: "System",
              system: true,
            });
            ack?.({ ok: false });
            return;
          }
        }

        const roomState = getRoomState(roomId);
        roomState.messageCount += 1;
        updateRoomActivity(io, roomId);

        const isAnnouncement = payload.type === "announcement";
        const isDirect = payload.type === "direct";
        const isPrivateQuestion = payload.type === "private_question";

        const serverPayload: ChatMessageServerPayload = {
          roomId,
          messageId: payload.messageId,
          text: sanitizedText,
          at: payload.at ?? new Date().toISOString(),
          userId: user?.id,
          author: user?.displayName ?? (user?.id ? `User ${user.id.slice(0, 6)}` : "Participant"),
          clientId: payload.clientId,
          type: (payload.type || "public") as ChatMessageServerPayload["type"],
          system: false,
          announcement: isAnnouncement,
        };

        if (isDirect) {
          const targetSocketId = Array.from(io.sockets.adapter.rooms.get(roomId) || []).find((sid) => {
            const sock = io.sockets.sockets.get(sid);
            return sock?.data?.user?.id === payload.recipientId;
          });
          if (targetSocketId) {
            io.to(targetSocketId).emit("chat:message", { ...serverPayload, type: "direct" });
          }
          socket.emit("chat:message", { ...serverPayload, type: "direct" });
        } else if (isPrivateQuestion) {
          const mentorSocketId = Array.from(io.sockets.adapter.rooms.get(roomId) || []).find((sid) => {
            const sock = io.sockets.sockets.get(sid);
            const role = sock?.data?.roomRole || sock?.data?.user?.role;
            return role === "host" || role === "mentor";
          });
          if (mentorSocketId) {
            io.to(mentorSocketId).emit("chat:message", { ...serverPayload, type: "private_question" });
          }
          socket.emit("chat:message", { ...serverPayload, type: "private_question" });
        } else {
          io.to(roomId).emit("chat:message", serverPayload);
        }

        ChatMessage.create({
          roomId,
          userId: user?.id,
          text: sanitizeChatText(serverPayload.text).replace(/</g, "&lt;").replace(/>/g, "&gt;"),
          messageId: payload.messageId,
        }).catch(() => undefined);

        const { type, resourceId } = parseRoomId(roomId);
        if ((type === "squad" || type === "peer") && resourceId) {
          PeerGroup.findByIdAndUpdate(resourceId, { $inc: { groupXP: 2 } }).catch(() => undefined);
        }

        ack?.({ ok: true, messageId: payload.messageId });
      },
    );

    socket.on("classroom:sync", (payload: ClassroomSyncPayload) => {
      if (socket.data.roomRole === "observer") return;
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

    socket.on(
      "room:heartbeat",
      (
        payload: HeartbeatPayload,
        ack?: (_response: { roomId: string; receivedAt: string; serverTime: string; lagMs: number }) => void,
      ) => {
        if (!isValidRoomId(payload?.roomId)) return;
        if (!consumeBudget(socket, "heartbeat", HEARTBEATS_PER_WINDOW)) return;
        if (!joinedRooms.has(payload.roomId)) return;
        const receivedAt = new Date().toISOString();
        const sentAtMs = Date.parse(payload.sentAt);
        updateRoomActivity(io, payload.roomId, payload.connectionQuality, false);

        const { type, resourceId } = parseRoomId(payload.roomId);
        if ((type === "session" || type === "classroom") && resourceId && user?.id) {
          recordHeartbeat(resourceId, user.id);
        }

        const response = {
          roomId: payload.roomId,
          receivedAt,
          serverTime: receivedAt,
          lagMs: Number.isFinite(sentAtMs) ? Math.max(0, Date.now() - sentAtMs) : 0,
        };
        ack?.(response);
        socket.emit("room:heartbeat:ack", response);
      },
    );

    socket.on("room:quality", (payload: { roomId: string; connectionQuality: ConnectionQuality }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const state = getRoomState(payload.roomId);
      state.connectionQuality = payload.connectionQuality;
      updateRoomActivity(io, payload.roomId, payload.connectionQuality, false);
    });

    socket.on("hand:raise", async (payload: { roomId: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const { resourceId } = parseRoomId(payload.roomId);
      if (!resourceId || !user?.id) return;
      try {
        const handRaise = await handRaiseService.raiseHand({ sessionId: resourceId, userId: user.id });
        const handPayload: HandRaisePayload = {
          roomId: payload.roomId,
          userId: user.id,
          userName: user.displayName || "Student",
          status: "raised",
          queuePosition: handRaise.queuePosition ?? undefined,
          at: new Date().toISOString(),
        };
        io.to(payload.roomId).emit("hand:raised", handPayload);
        const queue = await handRaiseService.getRaisedHandsQueue(resourceId);
        io.to(payload.roomId).emit("hand:queue", {
          roomId: payload.roomId,
          queue: queue.map((h) => ({
            userId: getRefId(h.student),
            userName: getRefName(h.student, "Student"),
            queuePosition: h.queuePosition,
          })),
        });
        io.to(payload.roomId).emit("notification:mentor", {
          roomId: payload.roomId,
          type: "hand_raised",
          message: `${user.displayName || "A student"} raised their hand`,
        });
      } catch (err) {
        logger.warn("Hand raise failed", { error: err });
      }
    });

    socket.on("hand:lower", async (payload: { roomId: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const { resourceId } = parseRoomId(payload.roomId);
      if (!resourceId || !user?.id) return;
      try {
        await handRaiseService.lowerHand({ sessionId: resourceId, userId: user.id });
        const handPayload: HandRaisePayload = {
          roomId: payload.roomId,
          userId: user.id,
          userName: user.displayName || "Student",
          status: "lowered",
          at: new Date().toISOString(),
        };
        io.to(payload.roomId).emit("hand:lowered", handPayload);
        const queue = await handRaiseService.getRaisedHandsQueue(resourceId);
        io.to(payload.roomId).emit("hand:queue", {
          roomId: payload.roomId,
          queue: queue.map((h) => ({
            userId: getRefId(h.student),
            userName: getRefName(h.student, "Student"),
            queuePosition: h.queuePosition,
          })),
        });
      } catch (err) {
        logger.warn("Hand lower failed", { error: err });
      }
    });

    socket.on("question:submit", async (payload: { roomId: string; questionId: string; text: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!joinedRooms.has(payload.roomId)) return;
      const { resourceId } = parseRoomId(payload.roomId);
      if (!resourceId || !user?.id || !payload.text?.trim()) return;
      try {
        const question = await questionService.createQuestion({
          sessionId: resourceId,
          userId: user.id,
          text: payload.text,
        });
        const qPayload: QuestionPayload = {
          roomId: payload.roomId,
          questionId: String(question._id),
          userId: user.id,
          userName: user.displayName || "Student",
          text: question.text,
          status: "pending",
          upvoteCount: 0,
          isPinned: false,
          at: new Date().toISOString(),
        };
        io.to(payload.roomId).emit("question:new", qPayload);
        io.to(payload.roomId).emit("notification:mentor", {
          roomId: payload.roomId,
          type: "new_question",
          message: `New question from ${user.displayName || "a student"}: ${question.text.slice(0, 100)}`,
        });
      } catch (err) {
        logger.warn("Question submit failed", { error: err });
      }
    });

    socket.on("question:upvote", async (payload: { roomId: string; questionId: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!payload.questionId || !user?.id) return;
      try {
        await questionService.upvoteQuestion({ questionId: payload.questionId, userId: user.id });
        const question = await questionService.getSessionQuestions({
          sessionId: payload.roomId.replace("session-", ""),
          status: undefined,
        });
        const updated = question.find((q) => String(q._id) === payload.questionId);
        if (updated) {
          const qPayload: QuestionPayload = {
            roomId: payload.roomId,
            questionId: payload.questionId,
            userId: getRefId(updated.student),
            userName: getRefName(updated.student, "Student"),
            text: updated.text,
            status: updated.status,
            upvoteCount: updated.upvoteCount,
            isPinned: updated.isPinned,
            at: new Date().toISOString(),
          };
          io.to(payload.roomId).emit("question:updated", qPayload);
        }
      } catch (err) {
        logger.warn("Question upvote failed", { error: err });
      }
    });

    socket.on(
      "poll:vote",
      async (payload: { roomId: string; pollId: string; optionIndex?: number; optionIndexes?: number[] }) => {
        if (!isValidRoomId(payload?.roomId)) return;
        if (!joinedRooms.has(payload.roomId)) return;
        if (!user?.id) return;
        try {
          await pollService.votePoll({
            pollId: payload.pollId,
            userId: user.id,
            optionIndexes: payload.optionIndexes ?? (payload.optionIndex !== undefined ? [payload.optionIndex] : []),
          });
          const pollResults = await pollService.getPollResults(payload.pollId);
          const pPayload: PollPayload = {
            roomId: payload.roomId,
            pollId: payload.pollId,
            question: pollResults.poll.question,
            type: pollResults.poll.type,
            status: pollResults.poll.status,
            options: pollResults.results.map((r) => ({
              text: r.text,
              voteCount: r.voteCount,
              percentage: r.percentage,
            })),
            totalVotes: pollResults.totalVotes,
            at: new Date().toISOString(),
          };
          io.to(payload.roomId).emit("poll:updated", pPayload);
        } catch (err) {
          logger.warn("Poll vote failed", { error: err });
        }
      },
    );

    socket.on(
      "participant:control",
      async (payload: { roomId: string; targetUserId: string; action: string; reason?: string }) => {
        if (!isValidRoomId(payload?.roomId)) return;
        if (!user?.id) return;

        const sessionId = payload.roomId.replace("session-", "");
        const actorRole = await getUserRole(user.id, sessionId);
        if (actorRole !== "host" && actorRole !== "cohost" && actorRole !== "moderator") {
          socket.emit("room:error", {
            roomId: payload.roomId,
            message: "Unauthorized. Emitter must be host/cohost/moderator.",
            code: "unauthorized",
          });
          return;
        }

        const ctrlPayload: ParticipantControlPayload = {
          roomId: payload.roomId,
          targetUserId: payload.targetUserId,
          action: payload.action as ParticipantControlPayload["action"],
          performedBy: user.id,
          at: new Date().toISOString(),
        };

        try {
          const targetUser = await User.findById(payload.targetUserId).select("fullName");
          const targetName = targetUser?.fullName || "Participant";

          switch (payload.action) {
            case "removed":
              if (actorRole !== "host" && actorRole !== "cohost") {
                socket.emit("room:error", {
                  roomId: payload.roomId,
                  message: "Unauthorized to remove participant.",
                  code: "unauthorized",
                });
                return;
              }
              await moderationService.removeParticipant({
                sessionId,
                userId: payload.targetUserId,
                actorId: user.id,
                reason: payload.reason,
                ip: socket.handshake.address,
              });
              await sendSystemMessage(
                io,
                payload.roomId,
                `${targetName} was removed from the session by ${user.displayName || "Host"}`,
              );
              break;

            case "blocked":
              if (actorRole !== "host" && actorRole !== "cohost") {
                socket.emit("room:error", {
                  roomId: payload.roomId,
                  message: "Unauthorized to block user.",
                  code: "unauthorized",
                });
                return;
              }
              await moderationService.blockUser({
                sessionId,
                userId: payload.targetUserId,
                actorId: user.id,
                reason: payload.reason,
                ip: socket.handshake.address,
              });
              await sendSystemMessage(io, payload.roomId, `${targetName} was blocked by ${user.displayName || "Host"}`);
              break;

            case "muted":
              await moderationService.muteUser({
                sessionId,
                userId: payload.targetUserId,
                actorId: user.id,
                durationMinutes: 1440,
                reason: payload.reason,
                ip: socket.handshake.address,
              });
              await sendSystemMessage(
                io,
                payload.roomId,
                `${targetName} was muted by ${user.displayName || "Moderator"}`,
              );
              break;

            case "unmuted":
              await moderationService.unmuteUser({
                sessionId,
                userId: payload.targetUserId,
                actorId: user.id,
                ip: socket.handshake.address,
              });
              await sendSystemMessage(
                io,
                payload.roomId,
                `${targetName} was unmuted by ${user.displayName || "Moderator"}`,
              );
              break;

            case "promoted": {
              if (actorRole !== "host") {
                socket.emit("room:error", {
                  roomId: payload.roomId,
                  message: "Only the host can promote users.",
                  code: "unauthorized",
                });
                return;
              }
              const pParticipant = await SessionParticipant.findOne({ session: sessionId, user: payload.targetUserId });
              if (pParticipant) {
                pParticipant.role = "cohost";
                await pParticipant.save();
              }
              await sendSystemMessage(
                io,
                payload.roomId,
                `${targetName} was promoted to cohost by ${user.displayName || "Host"}`,
              );
              break;
            }

            case "demoted": {
              if (actorRole !== "host") {
                socket.emit("room:error", {
                  roomId: payload.roomId,
                  message: "Only the host can demote users.",
                  code: "unauthorized",
                });
                return;
              }
              const dParticipant = await SessionParticipant.findOne({ session: sessionId, user: payload.targetUserId });
              if (dParticipant) {
                dParticipant.role = "participant";
                await dParticipant.save();
              }
              await sendSystemMessage(io, payload.roomId, `${targetName} was demoted by ${user.displayName || "Host"}`);
              break;
            }

            case "speaking_granted": {
              if (actorRole !== "host" && actorRole !== "cohost") {
                socket.emit("room:error", {
                  roomId: payload.roomId,
                  message: "Unauthorized to grant speaking permission.",
                  code: "unauthorized",
                });
                return;
              }
              const sgParticipant = await SessionParticipant.findOne({
                session: sessionId,
                user: payload.targetUserId,
              });
              if (sgParticipant) {
                sgParticipant.speakingPermission = true;
                sgParticipant.liveStatus = "speaking";
                await sgParticipant.save();
                io.to(payload.roomId).emit("participant:status", {
                  roomId: payload.roomId,
                  userId: payload.targetUserId,
                  status: "speaking",
                });
              }
              await sendSystemMessage(io, payload.roomId, `${targetName} was granted speaking permission`);
              break;
            }

            case "speaking_removed": {
              if (actorRole !== "host" && actorRole !== "cohost") {
                socket.emit("room:error", {
                  roomId: payload.roomId,
                  message: "Unauthorized to revoke speaking permission.",
                  code: "unauthorized",
                });
                return;
              }
              const srParticipant = await SessionParticipant.findOne({
                session: sessionId,
                user: payload.targetUserId,
              });
              if (srParticipant) {
                srParticipant.speakingPermission = false;
                srParticipant.liveStatus = "active";
                await srParticipant.save();
                io.to(payload.roomId).emit("participant:status", {
                  roomId: payload.roomId,
                  userId: payload.targetUserId,
                  status: "active",
                });
              }
              await sendSystemMessage(io, payload.roomId, `${targetName} speaking permission was revoked`);
              break;
            }
          }

          io.to(payload.roomId).emit("participant:control", ctrlPayload);
        } catch (err) {
          logger.warn("Participant control action failed", { error: err });
        }
      },
    );

    socket.on(
      "admission:action",
      async (payload: { roomId: string; targetUserId: string; action: "admit" | "deny" }) => {
        if (!isValidRoomId(payload?.roomId)) return;
        if (!user?.id) return;
        const { resourceId } = parseRoomId(payload.roomId);
        if (!resourceId) return;

        const actorRole = await getUserRole(user.id, resourceId);
        if (actorRole !== "host" && actorRole !== "cohost") {
          socket.emit("room:error", {
            roomId: payload.roomId,
            message: "Unauthorized. Emitter must be host/cohost.",
            code: "unauthorized",
          });
          return;
        }

        try {
          if (payload.action === "admit") {
            await admissionService.admitUser({
              sessionId: resourceId,
              userId: payload.targetUserId,
              actorId: user.id,
              ip: socket.handshake.address,
            });
          } else {
            await admissionService.denyUser({
              sessionId: resourceId,
              userId: payload.targetUserId,
              actorId: user.id,
              ip: socket.handshake.address,
            });
          }
          io.to(payload.roomId).emit("admission:update", {
            roomId: payload.roomId,
            userId: payload.targetUserId,
            action: payload.action === "admit" ? "admitted" : "denied",
            performedBy: user.id,
            at: new Date().toISOString(),
          });
          const waitingQueue = await admissionService.getWaitingQueue(resourceId);
          io.to(payload.roomId).emit("waiting:queue", {
            roomId: payload.roomId,
            queue: waitingQueue.map((w) => ({
              userId: getRefId(w.user),
              userName: getRefName(w.user, "Unknown"),
              joinedAt: w.createdAt?.toISOString?.() || new Date().toISOString(),
            })),
          });
        } catch (err) {
          logger.warn("Admission action failed", { error: err });
        }
      },
    );

    socket.on("admission:admit-all", async (payload: { roomId: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!user?.id) return;
      const { resourceId } = parseRoomId(payload.roomId);
      if (!resourceId) return;

      const actorRole = await getUserRole(user.id, resourceId);
      if (actorRole !== "host" && actorRole !== "cohost") {
        socket.emit("room:error", {
          roomId: payload.roomId,
          message: "Unauthorized. Emitter must be host/cohost.",
          code: "unauthorized",
        });
        return;
      }

      try {
        const queue = await admissionService.getWaitingQueue(resourceId);
        for (const entry of queue) {
          const targetId = String(entry.user?._id || entry.user);
          await admissionService.admitUser({
            sessionId: resourceId,
            userId: targetId,
            actorId: user.id,
            ip: socket.handshake.address,
          });
        }
        io.to(payload.roomId).emit("admission:update", {
          roomId: payload.roomId,
          userId: "__all__",
          action: "admitted_all",
          performedBy: user.id,
          at: new Date().toISOString(),
        });
        io.to(payload.roomId).emit("waiting:queue", { roomId: payload.roomId, queue: [] });
      } catch (err) {
        logger.warn("Admit all failed", { error: err });
      }
    });

    socket.on("mentor:request-overview", async (payload: { roomId: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!user?.id) return;
      const { resourceId } = parseRoomId(payload.roomId);
      if (!resourceId) return;
      try {
        const [participants, waiting, questions, raisedHands, polls, chatActivity] = await Promise.all([
          SessionParticipant.countDocuments({ session: resourceId, status: { $in: ["joined", "active"] } }),
          SessionParticipant.countDocuments({ session: resourceId, admissionStatus: "waiting" }),
          SessionQuestion.countDocuments({ session: resourceId, status: "pending" }),
          handRaiseService.getHandRaiseCount(resourceId),
          SessionPoll.countDocuments({ session: resourceId, status: "active" }),
          ChatMessage.countDocuments({ roomId: payload.roomId }),
        ]);
        socket.emit("room:overview", {
          roomId: payload.roomId,
          participantCount: participants,
          waitingCount: waiting,
          sessionDuration: "0",
          attendancePercent: 0,
          engagementScore: 0,
          questionsWaiting: questions,
          raisedHands,
          activePolls: polls,
          chatActivity,
        });
      } catch (err) {
        logger.warn("Overview request failed", { error: err });
      }
    });

    socket.on("whiteboard:draw", (payload: WhiteboardOpPayload) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!user?.id) return;
      if (!joinedRooms.has(payload.roomId)) return;
      if (socket.data.roomRole === "observer") return;

      socket.to(payload.roomId).emit("whiteboard:draw", payload);
    });

    socket.on("whiteboard:clear", (payload: { roomId: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!user?.id) return;
      if (!joinedRooms.has(payload.roomId)) return;
      if (socket.data.roomRole !== "host" && socket.data.roomRole !== "cohost") return;

      socket.to(payload.roomId).emit("whiteboard:clear", payload);
    });

    socket.on("whiteboard:undo", (payload: { roomId: string }) => {
      if (!isValidRoomId(payload?.roomId)) return;
      if (!user?.id) return;
      if (!joinedRooms.has(payload.roomId)) return;
      if (socket.data.roomRole === "observer") return;

      socket.to(payload.roomId).emit("whiteboard:undo", payload);
    });

    socket.on("dm:send", async (payload: { conversationId: string; text: string }) => {
      if (!user?.id || !payload.conversationId || !payload.text?.trim()) return;
      try {
        const { default: DMMessage } = await import("../models/DMMessage.js");
        const { default: Conversation } = await import("../models/Conversation.js");

        const conversation = await Conversation.findById(payload.conversationId);
        if (!conversation) return;
        if (!conversation.participants.some((p) => String(p) === String(user.id))) return;

        const message = await DMMessage.create({
          conversationId: payload.conversationId,
          senderId: user.id,
          text: payload.text.trim(),
          type: "text",
          readBy: [{ userId: user.id }],
        });

        await Conversation.findByIdAndUpdate(payload.conversationId, {
          lastMessageAt: new Date(),
          lastMessagePreview: payload.text.slice(0, 100),
        });

        for (const participantId of conversation.participants) {
          const participantSocket = Array.from(io.sockets.sockets.values()).find(
            (s) => (s.data.user as SocketUser)?.id === String(participantId),
          );
          if (participantSocket) {
            participantSocket.emit("dm:new", {
              conversationId: payload.conversationId,
              senderId: user.id,
              senderName: user.displayName || "User",
              text: payload.text,
              messageId: String(message._id),
              at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        logger.warn("DM send failed", { error: err });
      }
    });

    // DM Typing indicators
    socket.on("dm:typing-start", async (payload: { conversationId: string }) => {
      if (!socket.data.user) return;
      try {
        const Conversation = (await import("../models/Conversation.js")).default;
        const conversation = await Conversation.findById(payload.conversationId);
        if (!conversation || !conversation.participants.includes(socket.data.user.id)) return;

        for (const participantId of conversation.participants) {
          if (participantId.toString() === socket.data.user.id) continue;
          const participantSockets = await io.in(`user:${participantId}`).fetchSockets();
          for (const ps of participantSockets) {
            ps.emit("dm:typing", {
              conversationId: payload.conversationId,
              userId: socket.data.user.id,
              userName: socket.data.user.displayName || "Someone",
              at: new Date().toISOString(),
            });
          }
        }
      } catch {
        /* typing indicator errors are non-critical */
      }
    });

    socket.on("dm:typing-stop", async (payload: { conversationId: string }) => {
      if (!socket.data.user) return;
      try {
        const Conversation = (await import("../models/Conversation.js")).default;
        const conversation = await Conversation.findById(payload.conversationId);
        if (!conversation || !conversation.participants.includes(socket.data.user.id)) return;

        for (const participantId of conversation.participants) {
          if (participantId.toString() === socket.data.user.id) continue;
          const participantSockets = await io.in(`user:${participantId}`).fetchSockets();
          for (const ps of participantSockets) {
            ps.emit("dm:typing", {
              conversationId: payload.conversationId,
              userId: socket.data.user.id,
              userName: socket.data.user.displayName || "Someone",
              at: "", // empty at means typing stopped
            });
          }
        }
      } catch {
        /* typing indicator errors are non-critical */
      }
    });

    // DM Read receipts
    socket.on("dm:read", async (payload: { conversationId: string }) => {
      if (!socket.data.user) return;
      try {
        const Conversation = (await import("../models/Conversation.js")).default;
        const DMMessage = (await import("../models/DMMessage.js")).default;
        const conversation = await Conversation.findById(payload.conversationId);
        if (!conversation || !conversation.participants.includes(socket.data.user.id)) return;

        const now = new Date();
        const result = await DMMessage.updateMany(
          {
            conversationId: payload.conversationId,
            senderId: { $ne: socket.data.user.id },
            "readBy.userId": { $ne: socket.data.user.id },
          },
          { $push: { readBy: { userId: socket.data.user.id, readAt: now } } },
        );

        if (result.modifiedCount > 0) {
          const unreadMessages = await DMMessage.find({
            conversationId: payload.conversationId,
            senderId: { $ne: socket.data.user.id },
            "readBy.userId": socket.data.user.id,
          }).select("_id senderId");

          const senderIds = [...new Set(unreadMessages.map((m) => m.senderId.toString()))];
          const messageIds = unreadMessages.map((m) => m._id.toString());

          for (const senderId of senderIds) {
            const senderSockets = await io.in(`user:${senderId}`).fetchSockets();
            for (const ss of senderSockets) {
              ss.emit("dm:read-receipt", {
                conversationId: payload.conversationId,
                userId: socket.data.user.id,
                readAt: now.toISOString(),
                messageIds: messageIds.filter((id) =>
                  unreadMessages.some((m) => m._id.toString() === id && m.senderId.toString() === senderId),
                ),
              });
            }
          }
        }
      } catch {
        /* DM read receipt errors are non-critical */
      }
    });

    socket.on("notification:read", async (payload: { notificationId: string }) => {
      if (!user?.id || !payload.notificationId) return;
      try {
        const { default: Notification } = await import("../models/Notification.js");
        await Notification.findOneAndUpdate({ _id: payload.notificationId, recipient: user.id }, { isRead: true });
        const unreadCount = await Notification.countDocuments({ recipient: user.id, isRead: false });
        socket.emit("notification:count", { userId: user.id, count: unreadCount });
      } catch (err) {
        logger.warn("Notification read failed", { error: err });
      }
    });

    socket.on("disconnect", () => {
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

        const { type, resourceId } = parseRoomId(roomId);
        if ((type === "session" || type === "classroom") && resourceId && user?.id) {
          recordLeave(resourceId, user.id, socket.handshake.address)
            .then(async () => {
              if (user?.displayName) {
                await sendSystemMessage(io, roomId, `${user.displayName} left the session`);
              }
            })
            .catch((err) => {
              logger.warn("Failed to record disconnect leave", { roomId, userId: user.id, error: err });
            });
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
