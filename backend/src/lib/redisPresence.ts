import type { RedisClientType } from "redis";
import { logger } from "./logger.js";

export interface RoomPresence {
  roomId: string;
  onlineCount: number;
  connectedUserIds: string[];
  lastActivityAt: string;
  messageCount: number;
  connectionQuality: "good" | "degraded" | "poor";
}

const PRESENCE_KEY_PREFIX = "presence:";
const PRESENCE_TTL = 30 * 60; // 30 minutes

export class RedisPresenceService {
  constructor(private redis: RedisClientType) {}

  async recordJoin(roomId: string, userId: string): Promise<void> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:users`;
      await this.redis.sAdd(key, userId);
      await this.redis.expire(key, PRESENCE_TTL);
    } catch (error) {
      logger.warn("Failed to record presence join", { roomId, userId, error });
    }
  }

  async recordLeave(roomId: string, userId: string): Promise<void> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:users`;
      await this.redis.sRem(key, userId);
    } catch (error) {
      logger.warn("Failed to record presence leave", { roomId, userId, error });
    }
  }

  async getOnlineCount(roomId: string): Promise<number> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:users`;
      return await this.redis.sCard(key);
    } catch (error) {
      logger.warn("Failed to get online count", { roomId, error });
      return 0;
    }
  }

  async getConnectedUsers(roomId: string): Promise<string[]> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:users`;
      return await this.redis.sMembers(key);
    } catch (error) {
      logger.warn("Failed to get connected users", { roomId, error });
      return [];
    }
  }

  async recordActivity(roomId: string, quality: "good" | "degraded" | "poor"): Promise<void> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:activity`;
      await this.redis.hSet(key, {
        lastActivityAt: new Date().toISOString(),
        connectionQuality: quality,
      });
      await this.redis.expire(key, PRESENCE_TTL);
    } catch (error) {
      logger.warn("Failed to record activity", { roomId, error });
    }
  }

  async getActivity(roomId: string): Promise<{ lastActivityAt: string; connectionQuality: "good" | "degraded" | "poor" }> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:activity`;
      const data = await this.redis.hGetAll(key);
      return {
        lastActivityAt: data.lastActivityAt || new Date().toISOString(),
        connectionQuality: (data.connectionQuality as "good" | "degraded" | "poor") || "good",
      };
    } catch (error) {
      logger.warn("Failed to get activity", { roomId, error });
      return { lastActivityAt: new Date().toISOString(), connectionQuality: "good" };
    }
  }

  async incrementMessageCount(roomId: string): Promise<number> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:messages`;
      const count = await this.redis.incr(key);
      await this.redis.expire(key, PRESENCE_TTL);
      return count;
    } catch (error) {
      logger.warn("Failed to increment message count", { roomId, error });
      return 0;
    }
  }

  async getMessageCount(roomId: string): Promise<number> {
    try {
      const key = `${PRESENCE_KEY_PREFIX}${roomId}:messages`;
      const count = await this.redis.get(key);
      return parseInt(count || "0", 10);
    } catch (error) {
      logger.warn("Failed to get message count", { roomId, error });
      return 0;
    }
  }

  async getFullPresence(roomId: string): Promise<RoomPresence | null> {
    try {
      const [onlineCount, users, activity, messageCount] = await Promise.all([
        this.getOnlineCount(roomId),
        this.getConnectedUsers(roomId),
        this.getActivity(roomId),
        this.getMessageCount(roomId),
      ]);

      if (onlineCount === 0) {
        return null;
      }

      return {
        roomId,
        onlineCount,
        connectedUserIds: users,
        lastActivityAt: activity.lastActivityAt,
        messageCount,
        connectionQuality: activity.connectionQuality,
      };
    } catch (error) {
      logger.warn("Failed to get full presence", { roomId, error });
      return null;
    }
  }

  async clearRoom(roomId: string): Promise<void> {
    try {
      const keysToDelete = [
        `${PRESENCE_KEY_PREFIX}${roomId}:users`,
        `${PRESENCE_KEY_PREFIX}${roomId}:activity`,
        `${PRESENCE_KEY_PREFIX}${roomId}:messages`,
      ];
      await this.redis.del(keysToDelete);
    } catch (error) {
      logger.warn("Failed to clear room presence", { roomId, error });
    }
  }
}
