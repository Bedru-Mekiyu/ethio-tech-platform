import { Router } from "express";
import {
  createSession,
  endSession,
  getSessionFeedbackSummary,
  getLiveSessionAccess,
  getSessions,
  joinSession,
  leaveSession,
  startSession,
  submitSessionFeedback,
  updateSession,
} from "../controllers/sessionController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, sessionSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", protect, getSessions);
router.post("/", protect, authorize("mentor", "admin"), validateRequest({ body: sessionSchemas.create }), createSession);
router.patch("/:id", protect, authorize("mentor", "admin"), validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.update }), updateSession);
router.post("/:id/join", protect, authorize("student", "mentor", "admin"), validateRequest({ params: commonSchemas.idParam }), joinSession);
router.post("/:id/leave", protect, authorize("student", "mentor", "admin"), validateRequest({ params: commonSchemas.idParam }), leaveSession);
router.post("/:id/start", protect, authorize("mentor", "admin"), validateRequest({ params: commonSchemas.idParam }), startSession);
router.get("/:id/live-access", protect, authorize("student", "mentor", "admin"), validateRequest({ params: commonSchemas.idParam }), getLiveSessionAccess);
router.post("/:id/end", protect, authorize("mentor", "admin"), validateRequest({ params: commonSchemas.idParam }), endSession);
router.post("/:id/feedback", protect, authorize("student"), validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.feedback }), submitSessionFeedback);
router.get("/:id/feedback-summary", protect, authorize("mentor", "admin"), validateRequest({ params: commonSchemas.idParam }), getSessionFeedbackSummary);

export default router;
