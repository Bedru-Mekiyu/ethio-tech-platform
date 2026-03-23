import { Router } from "express";
import { assignBadge, createBadge, getBadges } from "../controllers/badgeController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getBadges);
router.post("/", protect, authorize("admin"), createBadge);
router.post("/assign", protect, authorize("mentor", "admin"), assignBadge);

export default router;
