import { Router } from "express";
import {
  createSession,
  endSession,
  getSessions,
  joinSession,
  leaveSession,
  updateSession,
} from "../controllers/sessionController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getSessions);
router.post("/", protect, authorize("mentor", "admin"), createSession);
router.patch("/:id", protect, authorize("mentor", "admin"), updateSession);
router.post("/:id/join", protect, authorize("student", "mentor", "admin"), joinSession);
router.post("/:id/leave", protect, authorize("student", "mentor", "admin"), leaveSession);
router.post("/:id/end", protect, authorize("mentor", "admin"), endSession);

export default router;
