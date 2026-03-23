import { Router } from "express";
import { getMyXpHistory, getMyXpSummary, grantXpManual } from "../controllers/xpController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/me/history", getMyXpHistory);
router.get("/me/summary", getMyXpSummary);
router.post("/grant", authorize("admin", "mentor"), grantXpManual);

export default router;
