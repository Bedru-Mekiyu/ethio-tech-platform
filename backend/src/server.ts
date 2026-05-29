import dotenv from "dotenv";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server as SocketServer } from "socket.io";
import type { RedisClientType } from "redis";
import { connectDB } from "./config/db.js";
import { validateEnvOnBoot, getEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { setupSocket } from "./socket/index.js";
import { logger } from "./lib/logger.js";

dotenv.config();
validateEnvOnBoot();

const PORT = getEnv().port;
let httpServer: ReturnType<typeof createServer> | null = null;
let redisClients: { pubClient: RedisClientType; subClient: RedisClientType } | null = null;

const closeRedisClients = async () => {
  if (!redisClients) return;

  const { pubClient, subClient } = redisClients;
  redisClients = null;
  await Promise.allSettled([pubClient.quit(), subClient.quit()]);
};

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer?.close(() => resolve());
    });
  }
  await closeRedisClients();
  await mongoose.connection.close();
  process.exit(0);
};

const startServer = async () => {
  await connectDB();

  const app = createApp();
  httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: getEnv().corsOrigin,
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });

  const redisUrl = process.env.REDIS_URL || process.env.RATE_LIMIT_REDIS_URL;
  if (redisUrl) {
    let pubClient: RedisClientType | null = null;
    let subClient: RedisClientType | null = null;
    try {
      const { createClient } = await import("redis");
      const { createAdapter } = await import("@socket.io/redis-adapter");
      pubClient = createClient({ url: redisUrl });
      subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      redisClients = { pubClient, subClient };
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.io Redis adapter enabled");
    } catch (error) {
      await Promise.allSettled([pubClient?.disconnect(), subClient?.disconnect()]);
      logger.warn("Socket.io Redis adapter unavailable; using in-memory adapter", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  setupSocket(io);
  app.set("io", io);

  httpServer.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
