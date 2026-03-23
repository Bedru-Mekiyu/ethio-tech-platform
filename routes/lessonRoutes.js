import { Router } from "express";
import {
  completeLesson,
  createLesson,
  deleteLesson,
  getLessonById,
  getLessons,
  updateLesson,
} from "../controllers/lessonController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getLessons);
router.get("/:id", getLessonById);
router.post("/", protect, authorize("admin", "mentor"), createLesson);
router.patch("/:id", protect, authorize("admin", "mentor"), updateLesson);
router.delete("/:id", protect, authorize("admin"), deleteLesson);
router.post("/:id/complete", protect, authorize("student"), completeLesson);

export default router;
