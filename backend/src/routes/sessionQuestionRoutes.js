import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionParticipant, requireSessionRole } from "../middlewares/sessionAuth.js";
import * as questionCtrl from "../controllers/sessionQuestionController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", requireSessionParticipant, questionCtrl.createQuestion);
router.get("/", requireSessionParticipant, questionCtrl.getQuestions);
router.get("/stats", requireSessionParticipant, questionCtrl.getQuestionStats);
router.put("/:questionId", requireSessionParticipant, questionCtrl.editQuestion);
router.delete("/:questionId", requireSessionParticipant, questionCtrl.deleteQuestion);
router.post("/:questionId/upvote", requireSessionParticipant, questionCtrl.upvoteQuestion);
router.post("/:questionId/answer", requireSessionRole("host", "cohost"), questionCtrl.answerQuestion);
router.post("/:questionId/pin", requireSessionRole("host", "cohost"), questionCtrl.pinQuestion);
router.post("/:questionId/archive", requireSessionRole("host", "cohost"), questionCtrl.archiveQuestion);
router.patch("/:questionId/status", requireSessionRole("host", "cohost"), questionCtrl.setQuestionStatus);

export default router;
