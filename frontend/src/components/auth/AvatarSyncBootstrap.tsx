import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { clearAvatarSnapshot, setAvatarSnapshot } from "@/store/avatarRegistry";

/**
 * Defers socket connection until 500ms after authentication is confirmed.
 * This prevents socket.io-client from blocking the initial page render.
 * Uses dynamic import to ensure the socket module is not eagerly resolved.
 */
export function AvatarSyncBootstrap() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cleanup: (() => void) | undefined;

    // Defer socket connection by 500ms — after the page is interactive
    const timer = setTimeout(() => {
      import("@/services/socket").then(({ acquireSocketConnection, releaseSocketConnection }) => {
        const socket = acquireSocketConnection();

        const handleAvatarUpdate = (payload: {
          userId?: string;
          avatarUrl?: string;
          avatarType?: "uploaded" | "default";
          avatarSource?: "cloudinary" | "system";
          updatedAt?: string;
        }) => {
          if (!payload.userId || !payload.avatarUrl) return;

          setAvatarSnapshot(payload.userId, {
            avatarUrl: payload.avatarUrl,
            avatarType: payload.avatarType,
            avatarSource: payload.avatarSource,
            updatedAt: payload.updatedAt,
          });

          const currentUser = useAuthStore.getState().user;
          if (currentUser?.id !== payload.userId) {
            return;
          }

          useAuthStore.getState().setUser({
            ...currentUser,
            avatar: payload.avatarUrl,
            avatarUrl: payload.avatarUrl,
            avatarType: payload.avatarType ?? currentUser.avatarType,
            avatarSource: payload.avatarSource ?? currentUser.avatarSource,
          });
        };

        socket.on("user:avatar:updated", handleAvatarUpdate);

        cleanup = () => {
          socket.off("user:avatar:updated", handleAvatarUpdate);
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.id) {
            clearAvatarSnapshot(currentUser.id);
          }
          releaseSocketConnection();
        };
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, [accessToken]);

  return null;
}
