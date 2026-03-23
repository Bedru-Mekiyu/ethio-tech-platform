import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/projectController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", protect, authorize("admin", "mentor"), createProject);
router.patch("/:id", protect, authorize("admin", "mentor"), updateProject);
router.delete("/:id", protect, authorize("admin"), deleteProject);

export default router;
