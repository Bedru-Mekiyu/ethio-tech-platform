import { Router } from "express";
import {
  createModule,
  deleteModule,
  getModuleById,
  getModules,
  updateModule,
} from "../controllers/moduleController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, moduleSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", getModules);
router.get("/:id", validateRequest({ params: commonSchemas.idParam }), getModuleById);
router.post("/", protect, authorize("admin", "mentor"), validateRequest({ body: moduleSchemas.create }), createModule);
router.patch("/:id", protect, authorize("admin", "mentor"), validateRequest({ params: commonSchemas.idParam, body: moduleSchemas.update }), updateModule);
router.delete("/:id", protect, authorize("admin"), validateRequest({ params: commonSchemas.idParam }), deleteModule);

export default router;
