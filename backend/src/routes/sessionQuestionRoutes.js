import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as questionCtrl from "../controllers/sessionQuestionController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", questionCtrl.createQuestion);
router.get("/", questionCtrl.getQuestions);
router.get("/stats", questionCtrl.getQuestionStats);
router.put("/:questionId", questionCtrl.editQuestion);
router.delete("/:questionId", questionCtrl.deleteQuestion);
router.post("/:questionId/upvote", questionCtrl.upvoteQuestion);
router.post("/:questionId/answer", requireSessionRole("host", "cohost"), questionCtrl.answerQuestion);
router.post("/:questionId/pin", requireSessionRole("host", "cohost"), questionCtrl.pinQuestion);
router.post("/:questionId/archive", requireSessionRole("host", "cohost"), questionCtrl.archiveQuestion);
router.patch("/:questionId/status", requireSessionRole("host", "cohost"), questionCtrl.setQuestionStatus);

export default router;
