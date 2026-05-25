import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getMyAvailability,
  requestMentorSession,
  setMyAvailability,
} from "../controllers/mentorAvailabilityController.js";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { mentorAvailabilitySchemas } from "../validators/schemas.js";

const router = Router();
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many session requests" },
});

router.get("/me", protect, authorize("mentor", "admin"), requireVerifiedMentor, getMyAvailability);
router.put("/me", protect, authorize("mentor", "admin"), requireVerifiedMentor, validateRequest({ body: mentorAvailabilitySchemas.set }), setMyAvailability);
router.post("/book", protect, authorize("student", "admin"), bookingLimiter, validateRequest({ body: mentorAvailabilitySchemas.book }), requestMentorSession);

export default router;
