import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import type {
  SocketClientToServerEvents,
  SocketServerToClientEvents,
} from "@/lib/realtime";

let socket: Socket<SocketServerToClientEvents, SocketClientToServerEvents> | null = null;

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

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
