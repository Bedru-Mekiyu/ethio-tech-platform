import { Router } from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import {
  createBreakoutRoom,
  assignParticipant,
  bulkAssignParticipants,
  closeBreakoutRoom,
  closeAllBreakoutRooms,
  getBreakouts,
  getBreakoutParticipantsList,
  startTimer,
} from "../controllers/breakoutController.js";

const router = Router({ mergeParams: true });

router.post(
  "/:sessionId/breakouts",
  protect,
  authorize("mentor", "admin"),
  requireSessionRole("host", "cohost"),
  createBreakoutRoom
);

router.post(
  "/:sessionId/breakouts/bulk-assign",
  protect,
  authorize("mentor", "admin"),
  requireSessionRole("host", "cohost"),
  bulkAssignParticipants
);

router.post(
  "/:sessionId/breakouts/:breakoutId/assign",
  protect,
  authorize("mentor", "admin"),
  requireSessionRole("host", "cohost"),
  assignParticipant
);

router.post(
  "/:sessionId/breakouts/:breakoutId/close",
  protect,
  authorize("mentor", "admin"),
  requireSessionRole("host", "cohost"),
  closeBreakoutRoom
);

router.post(
  "/:sessionId/breakouts/:breakoutId/timer",
  protect,
  authorize("mentor", "admin"),
  requireSessionRole("host"),
  startTimer
);

router.post(
  "/:sessionId/breakouts/close-all",
  protect,
  authorize("mentor", "admin"),
  requireSessionRole("host", "cohost"),
  closeAllBreakoutRooms
);

router.get(
  "/:sessionId/breakouts",
  protect,
  getBreakouts
);

router.get(
  "/:sessionId/breakouts/:breakoutId/participants",
  protect,
  getBreakoutParticipantsList
);

export default router;
