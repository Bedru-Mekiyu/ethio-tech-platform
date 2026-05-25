import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import type {
  SocketClientToServerEvents,
  SocketServerToClientEvents,
} from "@/lib/realtime";

let socket: Socket<SocketServerToClientEvents, SocketClientToServerEvents> | null = null;
let connectionRefCount = 0;

export function getSocket() {
  if (!socket) {
    const base = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1").replace(
      "/api/v1",
      ""
    );
    socket = io(base, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 750,
      reconnectionDelayMax: 8000,
      timeout: 15000,
      auth: { token: useAuthStore.getState().accessToken },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return s;
  }

  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

/** Increments shared connection refcount; call releaseSocketConnection on unmount. */
export function acquireSocketConnection() {
  connectionRefCount += 1;
  return connectSocket();
}

export function releaseSocketConnection() {
  connectionRefCount = Math.max(0, connectionRefCount - 1);
  if (connectionRefCount === 0 && socket?.connected) {
    socket.disconnect();
  }
}

/** Force teardown (e.g. logout). */
export function disconnectSocket() {
  connectionRefCount = 0;
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
