import { Router } from "express";
import {
  completeDailyChallenge,
  createDailyChallenge,
  getDailyChallenge,
  getMyStreak,
  pingDailyActivity,
} from "../controllers/gamificationController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/streak", protect, getMyStreak);
router.post("/streak/ping", protect, pingDailyActivity);
router.get("/daily-challenge", protect, getDailyChallenge);
router.post("/daily-challenge/complete", protect, completeDailyChallenge);
router.post("/daily-challenge", protect, authorize("admin"), createDailyChallenge);

export default router;
