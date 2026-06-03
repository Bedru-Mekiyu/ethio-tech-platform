import { Router } from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import {
  createNewAssignment,
  listAssignments,
  getAssignment,
  updateAssignmentDetails,
  submitStudentWork,
} from "../controllers/assignmentController.js";

const router = Router();

router.use(protect);

router.post("/", authorize("mentor", "admin"), requireVerifiedMentor, createNewAssignment);
router.get("/", listAssignments);
router.get("/:id", getAssignment);
router.patch("/:id", authorize("mentor", "admin"), requireVerifiedMentor, updateAssignmentDetails);
router.post("/:id/submit", authorize("student"), submitStudentWork);

export default router;
