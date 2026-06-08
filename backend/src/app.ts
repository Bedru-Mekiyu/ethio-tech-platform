import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import type { Server as SocketServer } from "socket.io";
import apiRouter from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { rejectMongoOperators } from "./middlewares/inputSecurity.js";
import { attachRequestId } from "./middlewares/requestId.js";
import { logger } from "./lib/logger.js";
import { getEnv } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();
  const env = getEnv();

  app.disable("x-powered-by");

  if (env.isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(rejectMongoOperators);
  app.use(attachRequestId);
  app.use(
    "/avatars",
    express.static(path.resolve(__dirname, "../public/avatars"), {
      maxAge: env.isProduction ? "30d" : 0,
      immutable: env.isProduction,
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    })
  );

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      if (durationMs >= 500 || res.statusCode >= 400) {
        logger.info("HTTP request", {
          requestId: (req as { requestId?: string }).requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs,
        });
      }
    });
    next();
  });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests" },
  });
  app.use("/api/", limiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "OK",
      mission: "Building Ethiopia's tech future",
      version: "v1",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health/ready", (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbReady = dbState === 1;
    res.status(dbReady ? 200 : 503).json({
      status: dbReady ? "ready" : "not_ready",
      database: dbReady ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health/realtime", (req, res) => {
    if (env.isProduction) {
      res.status(200).json({ status: "OK" });
      return;
    }
    const io = req.app.get("io") as SocketServer | undefined;
    res.status(200).json({
      status: "OK",
      rooms: io?.sockets.adapter.rooms.size ?? 0,
      activeSockets: io?.sockets.sockets.size ?? 0,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  if (!env.isProduction) {
    app.get("/", (_req, res) => {
      res.status(200).json({
        success: true,
        message: "Ethio Tech Platform API",
        docs: "/health",
        api: "/api/v1",
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Keep both prefixed and unprefixed API paths working for deployed clients.
  app.use(apiRouter);
  app.use("/api/v1", apiRouter);

  if (env.isProduction) {
    const frontendDist = path.resolve(__dirname, "../../frontend/dist");

    app.use(express.static(frontendDist, { maxAge: "30d", immutable: true }));

    app.use((req, res, next) => {
      if (req.path.startsWith("/api/") || req.path === "/api") {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
