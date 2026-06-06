import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionParticipant } from "../middlewares/sessionAuth.js";
import { getWhiteboard } from "../controllers/whiteboardController.js";

const router = Router({ mergeParams: true });

router.get("/:sessionId/whiteboard", protect, requireSessionParticipant, getWhiteboard);

export default router;
