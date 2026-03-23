import { Router } from "express";

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import trackRoutes from "./trackRoutes.js";
import moduleRoutes from "./moduleRoutes.js";
import lessonRoutes from "./lessonRoutes.js";
import projectRoutes from "./projectRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import xpRoutes from "./xpRoutes.js";
import sessionRoutes from "./sessionRoutes.js";
import peerGroupRoutes from "./peerGroupRoutes.js";
import leaderboardRoutes from "./leaderboardRoutes.js";
import resourceRoutes from "./resourceRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import hubRoutes from "./hubRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import badgeRoutes from "./badgeRoutes.js";
import certificateRoutes from "./certificateRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/tracks", trackRoutes);
router.use("/modules", moduleRoutes);
router.use("/lessons", lessonRoutes);
router.use("/projects", projectRoutes);
router.use("/submissions", submissionRoutes);
router.use("/xp", xpRoutes);
router.use("/sessions", sessionRoutes);
router.use("/peer-groups", peerGroupRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/resources", resourceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/hubs", hubRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/badges", badgeRoutes);
router.use("/certificates", certificateRoutes);

export default router;
