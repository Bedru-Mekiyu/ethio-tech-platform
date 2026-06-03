import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as feedbackCtrl from "../controllers/mentorStudentFeedbackController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", requireSessionRole("host", "cohost"), feedbackCtrl.submitStudentFeedback);
router.get("/", requireSessionRole("host", "cohost"), feedbackCtrl.getSessionStudentFeedback);
router.get("/my", feedbackCtrl.getMyStudentFeedback);
router.get("/:studentId", requireSessionRole("host", "cohost"), feedbackCtrl.getStudentFeedback);

export default router;
