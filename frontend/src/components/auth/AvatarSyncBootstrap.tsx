import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { acquireSocketConnection, releaseSocketConnection } from "@/services/socket";
import { clearAvatarSnapshot, setAvatarSnapshot } from "@/store/avatarRegistry";

export function AvatarSyncBootstrap() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

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

    return () => {
      socket.off("user:avatar:updated", handleAvatarUpdate);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.id) {
        clearAvatarSnapshot(currentUser.id);
      }
      releaseSocketConnection();
    };
  }, [accessToken]);

  return null;
}

