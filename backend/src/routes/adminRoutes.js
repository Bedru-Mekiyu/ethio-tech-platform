import { Router } from "express";
import {
  flagSubmission,
  getAnalytics,
  getAuditLogs,
  getModerationQueue,
} from "../controllers/adminController.js";
import {
  getQueueApplications,
  getQueueStats,
  approveApplication,
  rejectApplication,
  requestChanges,
} from "../controllers/adminMentorController.js";
import { protect, authorize, requirePermission } from "../middlewares/authMiddleware.js";
import { auditAction } from "../middlewares/auditLog.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas } from "../validators/schemas.js";
import { adminUserSchemas } from "../validators/adminSchemas.js";
import { PERMISSIONS } from "../config/permissions.js";
import adminUserRoutes from "./adminUserRoutes.js";

const router = Router();

router.use(protect, authorize("admin", "super_admin", "moderator", "reviewer"));

router.get("/analytics", authorize("admin", "super_admin"), getAnalytics);
router.get("/audit-logs", getAuditLogs);
router.get("/moderation", authorize("admin", "super_admin", "moderator"), getModerationQueue);
router.post(
  "/moderation/:id/flag",
  authorize("admin", "super_admin", "moderator"),
  auditAction("flag_submission", "submission"),
  flagSubmission
);

router.get("/mentor-applications/stats", requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS), getQueueStats);
router.get("/mentor-applications/pending", requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS), getQueueApplications("pending"));
router.get("/mentor-applications/approved", requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS), getQueueApplications("approved"));
router.get("/mentor-applications/rejected", requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS), getQueueApplications("rejected"));
router.get("/mentor-applications/changes-requested", requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS), getQueueApplications("changes-requested"));
router.get("/mentor-applications/archived", requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS), getQueueApplications("archived"));

router.post(
  "/mentor-applications/:id/approve",
  requirePermission(PERMISSIONS.MENTOR_APPROVE),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("approve_mentor_application", "mentor_application"),
  approveApplication
);
router.post(
  "/mentor-applications/:id/reject",
  requirePermission(PERMISSIONS.MENTOR_REJECT),
  validateRequest({ params: commonSchemas.idParam, body: adminUserSchemas.rejectMentor }),
  auditAction("reject_mentor_application", "mentor_application"),
  rejectApplication
);
router.post(
  "/mentor-applications/:id/request-changes",
  requirePermission(PERMISSIONS.MENTOR_REQUEST_CHANGES),
  validateRequest({ params: commonSchemas.idParam, body: adminUserSchemas.requestChangesMentor }),
  auditAction("request_mentor_changes", "mentor_application"),
  requestChanges
);

router.use(adminUserRoutes);

export default router;
