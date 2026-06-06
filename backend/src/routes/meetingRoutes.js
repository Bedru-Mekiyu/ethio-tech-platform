import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getMeetingStatus,
  getMyMeetings,
  getAdminMeetings,
  forceEndMeeting,
  getMeetingAttendance,
} from "../controllers/meetingController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, meetingSchemas } from "../validators/schemas.js";

const router = Router();

const meetingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);

router.get("/status/:id", meetingLimiter, validateRequest({ params: commonSchemas.idParam }), getMeetingStatus);
router.get("/mine", meetingLimiter, getMyMeetings);
router.get("/admin", authorize("admin", "super_admin"), meetingLimiter, getAdminMeetings);
router.post(
  "/:id/force-end",
  authorize("admin", "super_admin"),
  meetingLimiter,
  validateRequest({ params: commonSchemas.idParam, body: meetingSchemas.forceEnd }),
  forceEndMeeting,
);
router.get(
  "/:id/attendance",
  authorize("mentor", "admin", "super_admin"),
  meetingLimiter,
  validateRequest({ params: commonSchemas.idParam }),
  getMeetingAttendance,
);

export default router;
