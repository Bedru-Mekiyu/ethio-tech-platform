import { Router } from "express";
import {
  createNotification,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, notificationSchemas } from "../validators/schemas.js";

const router = Router();

router.use(protect);
router.get("/me", getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", validateRequest({ params: commonSchemas.idParam }), markNotificationRead);
router.post("/", authorize("mentor", "admin"), validateRequest({ body: notificationSchemas.create }), createNotification);

export default router;
