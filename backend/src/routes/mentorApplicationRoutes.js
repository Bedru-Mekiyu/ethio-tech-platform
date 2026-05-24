import { Router } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import { submitMentorApplication } from "../controllers/mentorApplicationController.js";
import { logger } from "../lib/logger.js";
import validateRequest from "../middlewares/validateRequest.js";
import { mentorApplicationSchemas } from "../validators/schemas.js";

const router = Router();
const redisUrl = process.env.RATE_LIMIT_REDIS_URL || process.env.REDIS_URL;
const redisClient = redisUrl ? createClient({ url: redisUrl }) : null;

if (redisClient) {
  redisClient.on("error", (error) => {
    logger.error("Mentor application limiter Redis error", { error: error.message });
  });

  void redisClient.connect().catch((error) => {
    logger.error("Failed to connect mentor application limiter Redis client", { error: error.message });
  });
}

const mentorApplicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many mentor applications" },
  store: redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      })
    : undefined,
});

router.post("/", mentorApplicationLimiter, validateRequest({ body: mentorApplicationSchemas.create }), submitMentorApplication);

export default router;
