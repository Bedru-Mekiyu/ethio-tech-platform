import { Router } from "express";
import {
  completeLesson,
  createLesson,
  deleteLesson,
  getMyLessonProgress,
  getMyLessonProgressSummary,
  getLessonById,
  getLessons,
  updateLesson,
} from "../controllers/lessonController.js";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, lessonSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", getLessons);
router.get("/me/progress", protect, authorize("student"), getMyLessonProgress);
router.get("/me/progress/summary", protect, authorize("student"), getMyLessonProgressSummary);
router.get("/:id", validateRequest({ params: commonSchemas.idParam }), getLessonById);
router.post("/", protect, authorize("admin", "super_admin", "moderator", "reviewer", "mentor"), requireVerifiedMentor, validateRequest({ body: lessonSchemas.create }), createLesson);
router.patch("/:id", protect, authorize("admin", "super_admin", "moderator", "reviewer", "mentor"), requireVerifiedMentor, validateRequest({ params: commonSchemas.idParam, body: lessonSchemas.update }), updateLesson);
router.delete("/:id", protect, authorize("admin", "super_admin"), validateRequest({ params: commonSchemas.idParam }), deleteLesson);
router.post("/:id/complete", protect, authorize("student"), validateRequest({ params: commonSchemas.idParam }), completeLesson);

export default router;
