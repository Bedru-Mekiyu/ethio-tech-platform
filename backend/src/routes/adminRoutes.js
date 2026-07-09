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
  getApplicationDetail,
  getApplicationAuditLog,
  startReview,
  provisionApplication,
  resendApplicationCredentials,
  resetApplicationPassword,
  archiveApplication,
  suspendMentor,
  reactivateMentor,
  deactivateMentor,
  removeMentorRole,
  getLoginHistory,
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

router.get(
  "/mentor-applications/:id",
  requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS),
  validateRequest({ params: commonSchemas.idParam }),
  getApplicationDetail
);
router.get(
  "/mentor-applications/:id/audit-log",
  requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS),
  validateRequest({ params: commonSchemas.idParam }),
  getApplicationAuditLog
);
router.get(
  "/mentor-applications/:id/login-history",
  requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS),
  validateRequest({ params: commonSchemas.idParam }),
  getLoginHistory
);

router.post(
  "/mentor-applications/:id/start-review",
  requirePermission(PERMISSIONS.MENTOR_VIEW_APPLICATIONS),
  validateRequest({ params: commonSchemas.idParam }),
  startReview
);
router.post(
  "/mentor-applications/:id/approve",
  requirePermission(PERMISSIONS.MENTOR_APPROVE),
  validateRequest({ params: commonSchemas.idParam }),
  approveApplication
);
router.post(
  "/mentor-applications/:id/reject",
  requirePermission(PERMISSIONS.MENTOR_REJECT),
  validateRequest({ params: commonSchemas.idParam, body: adminUserSchemas.rejectMentor }),
  rejectApplication
);
router.post(
  "/mentor-applications/:id/request-changes",
  requirePermission(PERMISSIONS.MENTOR_REQUEST_CHANGES),
  validateRequest({ params: commonSchemas.idParam, body: adminUserSchemas.requestChangesMentor }),
  requestChanges
);
router.post(
  "/mentor-applications/:id/provision",
  requirePermission(PERMISSIONS.MENTOR_PROVISION),
  validateRequest({ params: commonSchemas.idParam }),
  provisionApplication
);
router.post(
  "/mentor-applications/:id/resend-credentials",
  requirePermission(PERMISSIONS.MENTOR_RESEND_CREDENTIALS),
  validateRequest({ params: commonSchemas.idParam }),
  resendApplicationCredentials
);
router.post(
  "/mentor-applications/:id/reset-password",
  requirePermission(PERMISSIONS.USER_RESET_PASSWORD),
  validateRequest({ params: commonSchemas.idParam }),
  resetApplicationPassword
);
router.post(
  "/mentor-applications/:id/archive",
  requirePermission(PERMISSIONS.MENTOR_ARCHIVE),
  validateRequest({ params: commonSchemas.idParam }),
  archiveApplication
);
router.post(
  "/mentor-applications/:id/suspend",
  requirePermission(PERMISSIONS.MENTOR_SUSPEND),
  validateRequest({ params: commonSchemas.idParam, body: adminUserSchemas.mentorActionReason }),
  suspendMentor
);
router.post(
  "/mentor-applications/:id/reactivate",
  requirePermission(PERMISSIONS.MENTOR_SUSPEND),
  validateRequest({ params: commonSchemas.idParam }),
  reactivateMentor
);
router.post(
  "/mentor-applications/:id/deactivate",
  requirePermission(PERMISSIONS.MENTOR_SUSPEND),
  validateRequest({ params: commonSchemas.idParam }),
  deactivateMentor
);
router.post(
  "/mentor-applications/:id/remove-role",
  requirePermission(PERMISSIONS.USER_CHANGE_ROLE),
  validateRequest({ params: commonSchemas.idParam, body: adminUserSchemas.mentorActionReason }),
  removeMentorRole
);

router.use(adminUserRoutes);

export default router;
