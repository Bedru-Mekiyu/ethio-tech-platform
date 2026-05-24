import { Router } from "express";
import {
  flagSubmission,
  getAnalytics,
  getAuditLogs,
  getModerationQueue,
  getMentorApplications,
  reviewMentorApplication,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { auditAction } from "../middlewares/auditLog.js";
import validateRequest from "../middlewares/validateRequest.js";
import { adminSchemas, commonSchemas } from "../validators/schemas.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/analytics", getAnalytics);
router.get("/audit-logs", getAuditLogs);
router.get("/moderation", getModerationQueue);
router.get("/mentor-applications", getMentorApplications);
router.post("/moderation/:id/flag", auditAction("flag_submission", "submission"), flagSubmission);
router.patch(
  "/mentor-applications/:id",
  validateRequest({ params: commonSchemas.idParam, body: adminSchemas.reviewMentorApplication }),
  auditAction("review_mentor_application", "mentor_application"),
  reviewMentorApplication
);

export default router;
