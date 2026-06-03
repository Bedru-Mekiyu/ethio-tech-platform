import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as pollCtrl from "../controllers/sessionPollController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", requireSessionRole("host", "cohost"), pollCtrl.createPoll);
router.get("/", pollCtrl.getPolls);
router.get("/stats", pollCtrl.getPollStats);
router.get("/:pollId", pollCtrl.getPollResults);
router.post("/:pollId/vote", pollCtrl.votePoll);
router.post("/:pollId/close", requireSessionRole("host", "cohost"), pollCtrl.closePoll);
router.post("/:pollId/reopen", requireSessionRole("host", "cohost"), pollCtrl.reopenPoll);
router.post("/:pollId/publish", requireSessionRole("host", "cohost"), pollCtrl.publishResults);

export default router;
