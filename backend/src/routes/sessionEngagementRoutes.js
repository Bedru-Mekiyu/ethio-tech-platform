import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as engagementCtrl from "../controllers/sessionEngagementController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", requireSessionRole("host", "cohost"), engagementCtrl.getSessionEngagement);
router.get("/summary", requireSessionRole("host", "cohost"), engagementCtrl.getEngagementSummary);
router.get("/me", engagementCtrl.getMyEngagement);
router.post("/calculate/:userId", requireSessionRole("host", "cohost"), engagementCtrl.calculateEngagement);

export default router;
