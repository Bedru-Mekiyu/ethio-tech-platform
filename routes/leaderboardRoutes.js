import { Router } from "express";
import {
  getMentorLeaderboard,
  getPeerGroupLeaderboard,
  getStudentLeaderboard,
} from "../controllers/leaderboardController.js";

const router = Router();

router.get("/students", getStudentLeaderboard);
router.get("/mentors", getMentorLeaderboard);
router.get("/peer-groups", getPeerGroupLeaderboard);

export default router;
