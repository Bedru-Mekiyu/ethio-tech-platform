import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  submitMentorApplication,
  resubmitMentorApplication,
} from "../controllers/mentorApplicationController.js";
import { optionalProtect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, mentorApplicationSchemas } from "../validators/schemas.js";

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
  optionalProtect,
  validateRequest({ body: mentorApplicationSchemas.create }),
  submitMentorApplication
);

router.post(
  "/:id/resubmit",
  mentorApplicationLimiter,
  optionalProtect,
  validateRequest({ params: commonSchemas.idParam, body: mentorApplicationSchemas.resubmit }),
  resubmitMentorApplication
);

export default router;
