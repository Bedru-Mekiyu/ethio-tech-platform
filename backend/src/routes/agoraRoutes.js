import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import validateRequest from "../middlewares/validateRequest.js";
import { sessionSchemas } from "../validators/schemas.js";
import {
  getAgoraConfig,
  getAgoraToken,
  toggleScreenShare,
  startRecording,
  stopRecording,
} from "../controllers/agoraController.js";

const router = Router({ mergeParams: true });

router.get("/agora-config", protect, getAgoraConfig);

router.post("/:id/agora-token", protect, validateRequest({ params: sessionSchemas.idParam }), getAgoraToken);

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
