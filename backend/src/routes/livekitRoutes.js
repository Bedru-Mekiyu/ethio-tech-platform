import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionParticipant, requireSessionRole } from "../middlewares/sessionAuth.js";
import validateRequest from "../middlewares/validateRequest.js";
import { sessionSchemas } from "../validators/schemas.js";
import {
  getLiveKitConfig,
  getLiveKitToken,
  getMeetingInfo,
  muteRemoteParticipant,
  kickParticipant,
  handleLiveKitWebhook,
} from "../controllers/livekitController.js";
import { toggleScreenShare, startRecording, stopRecording } from "../controllers/sessionMediaController.js";

const router = Router({ mergeParams: true });

router.get("/livekit-config", protect, getLiveKitConfig);
router.get("/jitsi-config", protect, getLiveKitConfig);

router.post(
  "/:id/livekit-token",
  protect,
  requireSessionParticipant,
  validateRequest({ params: sessionSchemas.idParam }),
  getLiveKitToken,
);

router.post(
  "/:id/token",
  protect,
  requireSessionParticipant,
  validateRequest({ params: sessionSchemas.idParam }),
  getLiveKitToken,
);

router.post(
  "/:id/jitsi-token",
  protect,
  requireSessionParticipant,
  validateRequest({ params: sessionSchemas.idParam }),
  getLiveKitToken,
);

router.get(
  "/:id/meeting-info",
  protect,
  requireSessionParticipant,
  validateRequest({ params: sessionSchemas.idParam }),
  getMeetingInfo,
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

router.post(
  "/:id/mute-participant",
  protect,
  validateRequest({ params: sessionSchemas.idParam }),
  requireSessionRole("host", "cohost"),
  muteRemoteParticipant,
);

router.post(
  "/:id/remove-participant",
  protect,
  validateRequest({ params: sessionSchemas.idParam }),
  requireSessionRole("host"),
  kickParticipant,
);

router.post("/webhook", handleLiveKitWebhook);

export default router;
