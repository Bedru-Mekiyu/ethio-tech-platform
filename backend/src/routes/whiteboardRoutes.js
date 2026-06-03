import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getWhiteboard } from "../controllers/whiteboardController.js";

const router = Router({ mergeParams: true });

router.get("/:sessionId/whiteboard", protect, getWhiteboard);

export default router;
