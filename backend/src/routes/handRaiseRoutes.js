import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { requireSessionRole } from "../middlewares/sessionAuth.js";
import * as handRaiseCtrl from "../controllers/handRaiseController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/raise", handRaiseCtrl.raiseHand);
router.post("/lower", handRaiseCtrl.lowerHand);
router.get("/", handRaiseCtrl.getRaisedHands);
router.post("/call-on", requireSessionRole("host", "cohost"), handRaiseCtrl.callOnStudent);
router.post("/mark-answered", requireSessionRole("host", "cohost"), handRaiseCtrl.markAnswered);
router.post("/clear-all", requireSessionRole("host", "cohost"), handRaiseCtrl.clearAllHands);

export default router;
