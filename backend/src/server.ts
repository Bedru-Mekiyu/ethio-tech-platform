import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import type { RedisClientType } from "redis";
import mongoose from "mongoose";
import { connectDB, stopDB } from "./config/db.js";
import { validateEnvOnBoot, getEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { setupSocket } from "./socket/index.js";
import { logger } from "./lib/logger.js";
import { runSeed } from "./scripts/seed.js";

dotenv.config();
validateEnvOnBoot();

const PORT = getEnv().port;
let httpServer: ReturnType<typeof createServer> | null = null;
let socketServer: SocketServer | null = null;
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
  socketServer?.close();
  socketServer = null;
  await closeRedisClients();
  await stopDB();
  process.exit(0);
};

const startServer = async () => {
  await connectDB();

  if (!getEnv().isProduction) {
    const userCount = await mongoose.connection.collection("users").countDocuments();
    if (userCount === 0) {
      logger.info("Database is empty. Running auto-seed…");
      try {
        await runSeed({ verbose: true });
        logger.info("Auto-seed completed.");
      } catch (err) {
        logger.error("Auto-seed failed", err);
      }
    } else {
      logger.info(`Database already contains ${userCount} users; skipping auto-seed.`);
    }
  }

  const app = createApp();
  httpServer = createServer(app);
  socketServer = new SocketServer(httpServer, {
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
      socketServer.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.io Redis adapter enabled");
    } catch (error) {
      await Promise.allSettled([pubClient?.disconnect(), subClient?.disconnect()]);
      logger.warn("Socket.io Redis adapter unavailable; using in-memory adapter", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  setupSocket(socketServer);
  app.set("io", socketServer);

  try {
    const { startReminderEngine } = await import("./services/reminderService.js");
    startReminderEngine();
    logger.info("Reminder engine started");
  } catch (err) {
    logger.warn("Reminder engine failed to start", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
