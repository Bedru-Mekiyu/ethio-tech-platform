import { Router } from "express";
import { getSessionAnalytics, getMentorRankings } from "../controllers/analyticsController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/sessions", protect, authorize("admin"), getSessionAnalytics);
router.get("/mentor-rankings", protect, authorize("admin", "mentor"), getMentorRankings);

export default router;
