import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { acquireSocketConnection, releaseSocketConnection } from "@/services/socket";
import { fetchRoomMessages } from "@/services/chatService";
import {
  createMessageId,
  getConnectionQuality,
  storageKeyForRoom,
  type ConnectionQuality,
  type ConnectionStatus,
  type OutboxMessage,
  type RealtimeRoomState,
} from "@/lib/realtime";

const MAX_QUEUE_LENGTH = 40;
const MAX_QUEUE_AGE_MS = 6 * 60 * 60 * 1000;

interface UseRealtimeRoomOptions {
  roomId: string;
  userId?: string;
  onMessage: (message: {
    id: string;
    roomId: string;
    messageId: string;
    text: string;
    author: string;
    at: string;
    userId?: string;
    clientId?: string;
    mine?: boolean;
    system?: boolean;
    status?: "pending" | "sent" | "delivered";
  }) => void;
  onState?: (state: RealtimeRoomState) => void;
  onEvent?: (title: string, detail: string) => void;
}

const pruneQueuedMessages = (messages: OutboxMessage[]) => {
  const now = Date.now();
  return messages
    .filter((message) => {
      if (!message.queuedAt) return true;
      return now - Date.parse(message.queuedAt) < MAX_QUEUE_AGE_MS;
    })
    .slice(-MAX_QUEUE_LENGTH);
};

const readQueuedMessages = (roomId: string): OutboxMessage[] => {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(storageKeyForRoom(roomId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as OutboxMessage[];
    return Array.isArray(parsed) ? pruneQueuedMessages(parsed) : [];
  } catch {
    return [];
  }
};

const writeQueuedMessages = (roomId: string, messages: OutboxMessage[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKeyForRoom(roomId), JSON.stringify(pruneQueuedMessages(messages)));
};

export function useRealtimeRoom({ roomId, userId, onMessage, onState, onEvent }: UseRealtimeRoomOptions) {
  const socketRef = useRef<Socket | null>(null);
  const messageHandlerRef = useRef(onMessage);
  const stateHandlerRef = useRef(onState);
  const eventHandlerRef = useRef(onEvent);
  const queueRef = useRef<OutboxMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [presenceCount, setPresenceCount] = useState(1);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(getConnectionQuality());
  const [pendingCount, setPendingCount] = useState(() => readQueuedMessages(roomId).length);
  const [roomState, setRoomState] = useState<RealtimeRoomState | null>(null);
  const [isOnline, setIsOnline] = useState(getConnectionQuality() !== "offline");

  const loadHistory = useCallback(async () => {
    try {
      const history = await fetchRoomMessages(roomId);
      for (const item of history) {
        if (!item.messageId || !item.text) continue;
        messageHandlerRef.current({
          id: item.messageId,
          roomId,
          messageId: item.messageId,
          text: item.text,
          author: item.author ?? (item.userId === userId ? "You" : "Participant"),
          at: item.at,
          userId: item.userId,
          mine: item.userId === userId,
          status: "delivered",
        });
      }
    } catch {
      eventHandlerRef.current?.("History unavailable", "Live messages will still appear.");
    }
  }, [roomId, userId]);

  useEffect(() => {
    messageHandlerRef.current = onMessage;
    stateHandlerRef.current = onState;
    eventHandlerRef.current = onEvent;
  }, [onMessage, onState, onEvent]);

  const queueMessage = useCallback(
    (message: OutboxMessage) => {
      queueRef.current = pruneQueuedMessages([
        ...queueRef.current.filter((item) => item.messageId !== message.messageId),
        { ...message, queuedAt: message.queuedAt ?? new Date().toISOString() },
      ]);
      writeQueuedMessages(roomId, queueRef.current);
      setPendingCount(queueRef.current.length);
      eventHandlerRef.current?.("Queued offline", "Your message will send when the network recovers.");
    },
    [roomId]
  );

  const flushQueue = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !queueRef.current.length) return;

    const queued = [...queueRef.current];
    queueRef.current = [];
    writeQueuedMessages(roomId, queueRef.current);
    setPendingCount(0);

    for (const message of queued) {
      socket.emit("chat:message", message, (ack?: { ok: boolean }) => {
        if (!ack?.ok) queueMessage(message);
      });
    }
  }, [queueMessage, roomId]);

  const syncConnectionQuality = useCallback(() => {
    const nextQuality = getConnectionQuality();
    setConnectionQuality(nextQuality);
    setIsOnline(nextQuality !== "offline");
    socketRef.current?.emit("room:quality", { roomId, connectionQuality: nextQuality });
    return nextQuality;
  }, [roomId]);

  useEffect(() => {
    const queued = readQueuedMessages(roomId);
    queueRef.current = queued;
    queueMicrotask(() => setPendingCount(queued.length));
  }, [roomId]);

  useEffect(() => {
    void loadHistory();

    const socket = acquireSocketConnection();
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit("join-room", roomId);
      setConnectionStatus("connected");
      flushQueue();
    };

    const handleConnect = () => joinRoom();
    const handleReconnectAttempt = () => {
      setConnectionStatus("reconnecting");
      eventHandlerRef.current?.("Reconnecting", "Restoring your classroom session.");
    };
    const handleReconnect = () => {
      setConnectionStatus("connected");
      void loadHistory();
      flushQueue();
    };
    const handleDisconnect = (reason: string) => {
      setConnectionStatus(reason === "io client disconnect" ? "disconnected" : "reconnecting");
      if (reason !== "io client disconnect") {
        eventHandlerRef.current?.(
          "Connection lost",
          "The room will recover automatically when the network returns."
        );
      }
    };
    const handleConnectError = () => {
      setConnectionStatus("error");
      eventHandlerRef.current?.("Connection issue", "We are retrying in the background.");
    };
    const socketRecovery = socket as Socket & {
      on(event: "reconnect_attempt" | "reconnect", listener: (...args: unknown[]) => void): Socket;
      off(event: "reconnect_attempt" | "reconnect", listener?: (...args: unknown[]) => void): Socket;
    };
    const handlePresence = (payload: { roomId?: string; count?: number }) => {
      if (payload.roomId !== roomId || typeof payload.count !== "number") return;
      setPresenceCount(Math.max(1, payload.count));
    };
    const handleRoomState = (payload: RealtimeRoomState) => {
      if (payload.roomId !== roomId) return;
      setPresenceCount(Math.max(1, payload.onlineCount));
      setRoomState(payload);
      stateHandlerRef.current?.(payload);
    };
    const handleChatMessage = (payload: {
      roomId?: string;
      messageId?: string;
      text?: string;
      at?: string;
      userId?: string;
      author?: string;
      clientId?: string;
    }) => {
      if (!payload.roomId || payload.roomId !== roomId || !payload.messageId || !payload.text) return;

      messageHandlerRef.current({
        id: payload.messageId,
        roomId: payload.roomId,
        messageId: payload.messageId,
        text: payload.text,
        author: payload.author ?? (payload.userId === userId ? "You" : "Participant"),
        at: payload.at ?? new Date().toISOString(),
        userId: payload.userId,
        clientId: payload.clientId,
        mine: payload.userId === userId,
        status: "delivered",
      });
    };
    const handleHeartbeatAck = (payload: { roomId?: string }) => {
      if (payload.roomId !== roomId) return;
      syncConnectionQuality();
    };
    const handleRoomError = (payload: { roomId?: string; message?: string }) => {
      if (payload.roomId !== roomId) return;
      eventHandlerRef.current?.("Room warning", payload.message ?? "Realtime room issue detected.");
    };

    socket.on("connect", handleConnect);
    socketRecovery.on("reconnect_attempt", handleReconnectAttempt);
    socketRecovery.on("reconnect", handleReconnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("room:presence", handlePresence);
    socket.on("room:state", handleRoomState);
    socket.on("chat:message", handleChatMessage);
    socket.on("room:heartbeat:ack", handleHeartbeatAck);
    socket.on("room:error", handleRoomError);

    if (socket.connected) {
      joinRoom();
    }

    const heartbeatTimer = window.setInterval(() => {
      if (!socket.connected) return;
      socket.emit("room:heartbeat", {
        roomId,
        sentAt: new Date().toISOString(),
        connectionQuality: getConnectionQuality(),
      });
    }, 20_000);

    const onlineHandler = () => {
      setIsOnline(true);
      setConnectionQuality(syncConnectionQuality());
      if (!socket.connected) socket.connect();
      else flushQueue();
    };

    const offlineHandler = () => {
      setIsOnline(false);
      setConnectionQuality("offline");
      setConnectionStatus("disconnected");
      eventHandlerRef.current?.("Offline mode", "Messages are being queued until connectivity returns.");
    };

    const connection = (navigator as Navigator & {
      connection?: { addEventListener?: (type: "change", listener: () => void) => void; removeEventListener?: (type: "change", listener: () => void) => void };
    }).connection;
    const connectionChangeHandler = () => {
      const nextQuality = syncConnectionQuality();
      setConnectionQuality(nextQuality);
      if (nextQuality !== "offline" && socket.connected) flushQueue();
    };

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    connection?.addEventListener?.("change", connectionChangeHandler);

    return () => {
      window.clearInterval(heartbeatTimer);
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      connection?.removeEventListener?.("change", connectionChangeHandler);

      socket.off("connect", handleConnect);
      socketRecovery.off("reconnect_attempt", handleReconnectAttempt);
      socketRecovery.off("reconnect", handleReconnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("room:presence", handlePresence);
      socket.off("room:state", handleRoomState);
      socket.off("chat:message", handleChatMessage);
      socket.off("room:heartbeat:ack", handleHeartbeatAck);
      socket.off("room:error", handleRoomError);

      if (socket.connected) {
        socket.emit("leave-room", roomId);
      }
      releaseSocketConnection();
    };
  }, [flushQueue, loadHistory, roomId, syncConnectionQuality, userId]);

  const sendMessage = useCallback(
    (text: string, options?: { author?: string; userId?: string; system?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return null;

      const messageId = createMessageId();
      const at = new Date().toISOString();
      const payload: OutboxMessage = {
        roomId,
        messageId,
        text: trimmed,
        at,
        clientId: messageId,
        queuedAt: undefined,
      };

      messageHandlerRef.current({
        id: messageId,
        roomId,
        messageId,
        text: trimmed,
        author: options?.author ?? (options?.system ? "EthioTech" : "You"),
        at,
        userId: options?.userId ?? userId,
        clientId: messageId,
        mine: !options?.system,
        system: options?.system,
        status: "pending",
      });

      if (socketRef.current?.connected && isOnline) {
        socketRef.current.emit("chat:message", payload, (ack?: { ok: boolean }) => {
          if (!ack?.ok) queueMessage(payload);
        });
      } else {
        queueMessage(payload);
      }

      return messageId;
    },
    [isOnline, queueMessage, roomId, userId]
  );

  return {
    socketRef,
    connectionStatus,
    presenceCount,
    connectionQuality,
    pendingCount,
    roomState,
    isOnline,
    reconnect: () => {
      acquireSocketConnection();
    },
    sendMessage,
  };
}
