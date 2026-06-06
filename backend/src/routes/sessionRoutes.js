import { Router } from "express";
import {
  acceptSessionInvitation,
  admitFromWaitingRoom,
  cancelSession,
  cancelSessionWaitlist,
  closeRegistration,
  createSession,
  declineSessionInvitation,
  denyFromWaitingRoom,
  endSession,
  getSessionAvailability,
  getSessionById,
  getSessionFeedbackSummary,
  getMyInvitations,
  getMyWaitlistStatus,
  getSessionPresence,
  getSessionPresenceSummary,
  getWaitingQueueHandler,
  getLiveSessionAccess,
  getSessions,
  inviteToSession,
  joinSession,
  joinSessionWaitlist,
  joinSessionWaitingRoom,
  leaveSession,
  pauseSession,
  rescheduleSession,
  resumeSession,
  setParticipantRole,
  startSession,
  submitSessionFeedback,
  updateSession,
} from "../controllers/sessionController.js";
import { getStudentRecordings } from "../controllers/sessionRecordingController.js";
import rateLimit from "express-rate-limit";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import { auditAction } from "../middlewares/auditLog.js";
import { requireSessionParticipant, requireSessionRole } from "../middlewares/sessionAuth.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, sessionSchemas } from "../validators/schemas.js";

const sessionJoinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many join requests" },
});

const sessionInviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many invites" },
});

const router = Router();

// Base collection routes
router.get("/", protect, getSessions);
router.post(
  "/",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  validateRequest({ body: sessionSchemas.create }),
  auditAction("create_session", "session"),
  createSession
);

// Student recordings route (must be before :id to prevent matching as sessionId)
router.get("/recordings/my", protect, getStudentRecordings);

// Individual session routes
router.patch(
  "/:id",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.update }),
  auditAction("update_session", "session"),
  updateSession
);

router.post(
  "/:id/join",
  protect,
  authorize("student", "mentor", "admin"),
  sessionJoinLimiter,
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("join_session", "session"),
  joinSession
);

router.post(
  "/:id/leave",
  protect,
  authorize("student", "mentor", "admin"),
  sessionJoinLimiter,
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("leave_session", "session"),
  leaveSession
);

router.post(
  "/:id/start",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("start_session", "session"),
  startSession
);

router.post(
  "/:id/cancel",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host"),
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.cancel }),
  auditAction("cancel_session", "session"),
  cancelSession
);

router.get(
  "/:id/presence",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost", "moderator"),
  validateRequest({ params: commonSchemas.idParam }),
  getSessionPresence
);

router.get(
  "/:id/presence/summary",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost", "moderator"),
  validateRequest({ params: commonSchemas.idParam }),
  getSessionPresenceSummary
);

router.post(
  "/:id/role",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.setRole }),
  setParticipantRole
);

router.post(
  "/:id/waiting-room/join",
  protect,
  authorize("student", "mentor", "admin"),
  validateRequest({ params: commonSchemas.idParam }),
  joinSessionWaitingRoom
);

router.post(
  "/:id/waiting-room/admit",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.admissionAction }),
  auditAction("admit_user", "session"),
  admitFromWaitingRoom
);

router.post(
  "/:id/waiting-room/deny",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.admissionAction }),
  auditAction("deny_user", "session"),
  denyFromWaitingRoom
);

router.get(
  "/:id/waiting-room/queue",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost", "moderator"),
  validateRequest({ params: commonSchemas.idParam }),
  getWaitingQueueHandler
);

router.get(
  "/:id/availability",
  protect,
  validateRequest({ params: commonSchemas.idParam }),
  getSessionAvailability
);

router.post(
  "/:id/waitlist",
  protect,
  authorize("student", "mentor", "admin"),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("join_waitlist", "session"),
  joinSessionWaitlist
);

router.post(
  "/:id/waitlist/cancel",
  protect,
  authorize("student", "mentor", "admin"),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("cancel_waitlist", "session"),
  cancelSessionWaitlist
);

router.get(
  "/:id/waitlist/status",
  protect,
  validateRequest({ params: commonSchemas.idParam }),
  getMyWaitlistStatus
);

router.get(
  "/:id/live-access",
  protect,
  requireSessionParticipant,
  validateRequest({ params: commonSchemas.idParam }),
  getLiveSessionAccess
);

router.post(
  "/:id/end",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("end_session", "session"),
  endSession
);

router.post(
  "/:id/pause",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("pause_session", "session"),
  pauseSession
);

router.post(
  "/:id/resume",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("resume_session", "session"),
  resumeSession
);

router.post(
  "/:id/close-registration",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host"),
  validateRequest({ params: commonSchemas.idParam }),
  auditAction("close_registration", "session"),
  closeRegistration
);

router.post(
  "/:id/reschedule",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host"),
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.reschedule }),
  auditAction("reschedule_session", "session"),
  rescheduleSession
);

router.post(
  "/:id/feedback",
  protect,
  authorize("student"),
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.feedback }),
  submitSessionFeedback
);

router.get(
  "/:id/feedback-summary",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  validateRequest({ params: commonSchemas.idParam }),
  getSessionFeedbackSummary
);

router.post(
  "/:id/invite",
  protect,
  authorize("mentor", "admin"),
  requireVerifiedMentor,
  requireSessionRole("host", "cohost"),
  sessionInviteLimiter,
  validateRequest({ params: commonSchemas.idParam, body: sessionSchemas.invite }),
  auditAction("invite_user", "session"),
  inviteToSession
);

router.get(
  "/:id",
  protect,
  requireSessionParticipant,
  validateRequest({ params: commonSchemas.idParam }),
  getSessionById
);

// Session invitations
router.get("/invitations/mine", protect, getMyInvitations);
router.post(
  "/invitations/:id/accept",
  protect,
  validateRequest({ params: commonSchemas.idParam }),
  acceptSessionInvitation
);
router.post(
  "/invitations/:id/decline",
  protect,
  validateRequest({ params: commonSchemas.idParam }),
  declineSessionInvitation
);

export default router;
