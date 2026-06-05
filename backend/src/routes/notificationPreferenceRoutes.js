import { Router } from "express";
import { getPreferences, updatePreferences } from "../controllers/notificationPreferenceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", getPreferences);
router.put("/", updatePreferences);

export default router;
