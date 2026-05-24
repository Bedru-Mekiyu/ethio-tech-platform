import { Router } from "express";
import { getMentorDashboard, getStudentDashboard } from "../controllers/dashboardController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/student", protect, authorize("student"), getStudentDashboard);
router.get("/mentor", protect, authorize("mentor", "admin"), getMentorDashboard);

export default router;
