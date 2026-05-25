import { Router } from "express";
import { getMyXpHistory, getMyXpSummary, grantXpManual } from "../controllers/xpController.js";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { xpSchemas } from "../validators/schemas.js";

const router = Router();

router.use(protect);
router.get("/me/history", getMyXpHistory);
router.get("/me/summary", getMyXpSummary);
router.post("/grant", authorize("admin", "mentor"), requireVerifiedMentor, validateRequest({ body: xpSchemas.grant }), grantXpManual);

export default router;
