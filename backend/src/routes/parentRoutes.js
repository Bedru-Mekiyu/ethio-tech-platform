import { Router } from "express";
import { getParentDashboard } from "../controllers/parentController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, authorize("parent", "admin"));
router.get("/dashboard", getParentDashboard);

export default router;
