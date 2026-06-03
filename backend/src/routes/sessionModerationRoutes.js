import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as modCtrl from "../controllers/sessionModerationController.js";

const router = Router({ mergeParams: true });

router.use(protect);
router.use(requireSessionRole("host", "cohost", "moderator"));

router.post("/delete-message", modCtrl.deleteMessage);
router.post("/mute", modCtrl.muteUser);
router.post("/unmute", modCtrl.unmuteUser);
router.post("/timeout", modCtrl.timeoutUser);
router.post("/remove", modCtrl.removeParticipant);
router.post("/report-abuse", modCtrl.reportAbuse);
router.get("/logs", modCtrl.getModerationLogs);

export default router;
