import { Router } from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { z } from "zod";
import {
  trackAnalyticsEvent,
  getMyEventSummary,
  getEventTrendsData,
  getPlatformEventSummaryData,
} from "../controllers/analyticsEventController.js";

const router = Router();

const trackEventSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional(),
  source: z.enum(["web", "mobile", "api", "socket"]).optional(),
  sessionId: z.string().optional(),
  trackId: z.string().optional(),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
  projectSubmissionId: z.string().optional(),
});

router.post(
  "/track",
  protect,
  validateRequest(trackEventSchema),
  trackAnalyticsEvent
);
router.get("/my-summary", protect, getMyEventSummary);
router.get(
  "/trends",
  protect,
  authorize("admin", "super_admin", "mentor"),
  getEventTrendsData
);
router.get(
  "/platform",
  protect,
  authorize("admin", "super_admin"),
  getPlatformEventSummaryData
);

export default router;
