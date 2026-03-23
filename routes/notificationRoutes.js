import { Router } from "express";
import {
  createNotification,
  getMyNotifications,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/me", getMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.post("/", authorize("mentor", "admin"), createNotification);

export default router;
