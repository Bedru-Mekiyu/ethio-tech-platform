import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionParticipant, requireSessionRole } from "../middlewares/sessionAuth.js";
import validateRequest from "../middlewares/validateRequest.js";
import { sessionSchemas } from "../validators/schemas.js";
import { getJitsiConfig, getJitsiToken, getMeetingInfo } from "../controllers/jitsiController.js";
import { toggleScreenShare, startRecording, stopRecording } from "../controllers/sessionMediaController.js";

const router = Router({ mergeParams: true });

router.get("/jitsi-config", protect, getJitsiConfig);

router.post(
  "/:id/jitsi-token",
  protect,
  requireSessionParticipant,
  validateRequest({ params: sessionSchemas.idParam }),
  getJitsiToken
);

router.get(
  "/:id/meeting-info",
  protect,
  requireSessionParticipant,
  validateRequest({ params: sessionSchemas.idParam }),
  getMeetingInfo
);

router.post(
  "/:id/screen-share",
  protect,
  validateRequest({ params: sessionSchemas.idParam }),
  requireSessionRole("host", "cohost"),
  toggleScreenShare,
);

router.post(
  "/:id/recording/start",
  protect,
  validateRequest({ params: sessionSchemas.idParam }),
  requireSessionRole("host"),
  startRecording,
);

router.post(
  "/:id/recording/stop",
  protect,
  validateRequest({ params: sessionSchemas.idParam }),
  requireSessionRole("host"),
  stopRecording,
);

export default router;
