import { Router } from "express";
import rateLimit from "express-rate-limit";
import { protect, requirePermission } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { PERMISSIONS, RATE_LIMITS } from "../config/permissions.js";
import {
  getAdminUsers,
  getAdminUserById,
  createUser,
  updateUser,
  changeUserRole,
  verifyUser,
  suspendUser,
  reactivateUser,
  banUser,
  softDeleteUser,
  restoreUser,
  permanentDeleteUser,
  forceLogoutUser,
  resetUserPassword,
  bulkAction,
  exportUsers,
  sendAnnouncement,
  getUserAnalytics,
  getDeletedUsers,
} from "../controllers/adminUserController.js";
import { adminUserSchemas } from "../validators/adminSchemas.js";

const router = Router();

router.use(protect);

const adminActionLimiter = rateLimit(RATE_LIMITS.ADMIN_USER_ACTION);
const adminDeleteLimiter = rateLimit(RATE_LIMITS.ADMIN_USER_DELETE);
const adminBulkLimiter = rateLimit(RATE_LIMITS.ADMIN_BULK_ACTION);
const adminExportLimiter = rateLimit(RATE_LIMITS.ADMIN_EXPORT);

router.get(
  "/users",
  requirePermission(PERMISSIONS.USER_VIEW_SENSITIVE),
  getAdminUsers
);

router.get(
  "/users/analytics",
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  getUserAnalytics
);

router.get(
  "/users/deleted",
  requirePermission(PERMISSIONS.USER_VIEW_SENSITIVE),
  getDeletedUsers
);

router.get(
  "/users/export",
  requirePermission(PERMISSIONS.USER_EXPORT),
  adminExportLimiter,
  exportUsers
);

router.get(
  "/users/:id",
  requirePermission(PERMISSIONS.USER_VIEW_SENSITIVE),
  getAdminUserById
);

router.post(
  "/users",
  requirePermission(PERMISSIONS.USER_CREATE),
  adminActionLimiter,
  validateRequest({ body: adminUserSchemas.create }),
  createUser
);

router.patch(
  "/users/:id",
  requirePermission(PERMISSIONS.USER_EDIT),
  validateRequest({ body: adminUserSchemas.update }),
  updateUser
);

router.patch(
  "/users/:id/role",
  requirePermission(PERMISSIONS.USER_CHANGE_ROLE),
  validateRequest({ body: adminUserSchemas.changeRole }),
  changeUserRole
);

router.post(
  "/users/:id/verify",
  requirePermission(PERMISSIONS.USER_VERIFY),
  verifyUser
);

router.post(
  "/users/:id/suspend",
  requirePermission(PERMISSIONS.USER_SUSPEND),
  adminActionLimiter,
  validateRequest({ body: adminUserSchemas.suspendBan }),
  suspendUser
);

router.post(
  "/users/:id/reactivate",
  requirePermission(PERMISSIONS.USER_REACTIVATE),
  reactivateUser
);

router.post(
  "/users/:id/ban",
  requirePermission(PERMISSIONS.USER_BAN),
  adminActionLimiter,
  validateRequest({ body: adminUserSchemas.suspendBan }),
  banUser
);

router.delete(
  "/users/:id",
  requirePermission(PERMISSIONS.USER_SOFT_DELETE),
  adminDeleteLimiter,
  validateRequest({ params: adminUserSchemas.idParam }),
  softDeleteUser
);

router.post(
  "/users/:id/restore",
  requirePermission(PERMISSIONS.USER_RESTORE),
  restoreUser
);

router.delete(
  "/users/:id/permanent",
  requirePermission(PERMISSIONS.USER_DELETE),
  adminDeleteLimiter,
  permanentDeleteUser
);

router.post(
  "/users/:id/force-logout",
  requirePermission(PERMISSIONS.USER_FORCE_LOGOUT),
  forceLogoutUser
);

router.post(
  "/users/:id/reset-password",
  requirePermission(PERMISSIONS.USER_RESET_PASSWORD),
  adminActionLimiter,
  validateRequest({ body: adminUserSchemas.resetPassword }),
  resetUserPassword
);

router.post(
  "/bulk",
  requirePermission(PERMISSIONS.BULK_ACTIONS),
  adminBulkLimiter,
  validateRequest({ body: adminUserSchemas.bulkAction }),
  bulkAction
);

router.post(
  "/announcements",
  requirePermission(PERMISSIONS.ANNOUNCEMENT_SEND),
  adminActionLimiter,
  validateRequest({ body: adminUserSchemas.announcement }),
  sendAnnouncement
);

export default router;
