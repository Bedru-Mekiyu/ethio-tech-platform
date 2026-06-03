import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import * as analyticsCtrl from "../controllers/mentorAnalyticsController.js";
import { getMentorStudents } from "../controllers/mentorStudentsController.js";

const router = Router();

router.get("/analytics", protect, analyticsCtrl.getMentorAnalytics);
router.get("/analytics/cohort", protect, analyticsCtrl.getCohortAnalytics);
router.get("/analytics/export", protect, analyticsCtrl.exportAnalyticsCSV);
router.get("/analytics/students/:studentId/progress", protect, analyticsCtrl.getStudentProgress);
router.get("/students", protect, getMentorStudents);
router.get("/sessions/:sessionId/analytics", protect, analyticsCtrl.getMentorSessionAnalytics);
router.get("/sessions/:sessionId/control-center", protect, analyticsCtrl.getMentorControlCenterData);

export default router;
