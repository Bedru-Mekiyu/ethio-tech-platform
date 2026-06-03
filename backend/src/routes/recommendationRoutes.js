import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getRecommendedLessonsData,
  getRecommendedTracksData,
  getSkillGapData,
  getLearningGoalsData,
} from "../controllers/recommendationController.js";

const router = Router();

router.get("/lessons", protect, getRecommendedLessonsData);
router.get("/tracks", protect, getRecommendedTracksData);
router.get("/skill-gap", protect, getSkillGapData);
router.get("/goals", protect, getLearningGoalsData);

export default router;
