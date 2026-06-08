import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitMentorApplication } from "../controllers/mentorApplicationController.js";
import validateRequest from "../middlewares/validateRequest.js";
import { mentorApplicationSchemas } from "../validators/schemas.js";

const router = Router();

const mentorApplicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many applications. Please try again later." },
});

router.post(
  "/",
  mentorApplicationLimiter,
  validateRequest({ body: mentorApplicationSchemas.create }),
  submitMentorApplication
);

export default router;
