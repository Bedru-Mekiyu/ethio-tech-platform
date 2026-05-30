import { useSyncExternalStore } from "react";

export interface AvatarSnapshot {
  avatarUrl?: string;
  avatarType?: "uploaded" | "default";
  avatarSource?: "cloudinary" | "system";
  updatedAt?: string;
}

const registry = new Map<string, AvatarSnapshot>();
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export function setAvatarSnapshot(userId: string, snapshot: AvatarSnapshot) {
  registry.set(userId, snapshot);
  emit();
}

export function clearAvatarSnapshot(userId: string) {
  registry.delete(userId);
  emit();
}

export function getAvatarSnapshot(userId?: string | null) {
  if (!userId) return null;
  return registry.get(userId) ?? null;
}

export function useAvatarSnapshot(userId?: string | null) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => getAvatarSnapshot(userId),
    () => null
  );
}

