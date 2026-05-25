import dotenv from "dotenv";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server as SocketServer } from "socket.io";
import { connectDB } from "./config/db.js";
import { validateEnvOnBoot, getEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { setupSocket } from "./socket/index.js";
import { logger } from "./lib/logger.js";

dotenv.config();
validateEnvOnBoot();

const PORT = getEnv().port;
let httpServer: ReturnType<typeof createServer> | null = null;

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer?.close(() => resolve());
    });
  }
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
  });

  const redisUrl = process.env.REDIS_URL || process.env.RATE_LIMIT_REDIS_URL;
  if (redisUrl) {
    try {
      const { createClient } = await import("redis");
      const { createAdapter } = await import("@socket.io/redis-adapter");
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.io Redis adapter enabled");
    } catch (error) {
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
