import { Router } from "express";
import {
  createModule,
  deleteModule,
  getModuleById,
  getModules,
  updateModule,
} from "../controllers/moduleController.js";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, moduleSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", getModules);
router.get("/:id", validateRequest({ params: commonSchemas.idParam }), getModuleById);
router.post("/", protect, authorize("admin", "super_admin", "moderator", "reviewer", "mentor"), requireVerifiedMentor, validateRequest({ body: moduleSchemas.create }), createModule);
router.patch("/:id", protect, authorize("admin", "super_admin", "moderator", "reviewer", "mentor"), requireVerifiedMentor, validateRequest({ params: commonSchemas.idParam, body: moduleSchemas.update }), updateModule);
router.delete("/:id", protect, authorize("admin", "super_admin"), validateRequest({ params: commonSchemas.idParam }), deleteModule);

export default router;
