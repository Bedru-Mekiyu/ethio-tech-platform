import { Router } from "express";
import {
  flagSubmission,
  getAnalytics,
  getAuditLogs,
  getModerationQueue,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { auditAction } from "../middlewares/auditLog.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/analytics", getAnalytics);
router.get("/audit-logs", getAuditLogs);
router.get("/moderation", getModerationQueue);
router.post("/moderation/:id/flag", auditAction("flag_submission", "submission"), flagSubmission);

export default router;
