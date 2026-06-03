import { Router } from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createNewCohort,
  listCohorts,
  getCohortDetails,
  updateCohortDetails,
  addStudent,
  removeStudent,
  getCohortAnalyticsData,
  refreshCohortProgress,
} from "../controllers/cohortController.js";

const router = Router();

router.use(protect);
router.use(authorize("mentor", "admin"));

router.post("/", createNewCohort);
router.get("/", listCohorts);
router.get("/:cohortId", getCohortDetails);
router.patch("/:cohortId", updateCohortDetails);
router.post("/:cohortId/students", addStudent);
router.delete("/:cohortId/students/:userId", removeStudent);
router.get("/:cohortId/analytics", getCohortAnalyticsData);
router.post("/:cohortId/refresh", refreshCohortProgress);

export default router;
