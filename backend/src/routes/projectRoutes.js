import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/projectController.js";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, projectSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", getProjects);
router.get("/:id", validateRequest({ params: commonSchemas.idParam }), getProjectById);
router.post("/", protect, authorize("admin", "mentor"), requireVerifiedMentor, validateRequest({ body: projectSchemas.create }), createProject);
router.patch("/:id", protect, authorize("admin", "mentor"), requireVerifiedMentor, validateRequest({ params: commonSchemas.idParam, body: projectSchemas.update }), updateProject);
router.delete("/:id", protect, authorize("admin"), validateRequest({ params: commonSchemas.idParam }), deleteProject);

export default router;
