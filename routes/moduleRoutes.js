import { Router } from "express";
import {
  createModule,
  deleteModule,
  getModuleById,
  getModules,
  updateModule,
} from "../controllers/moduleController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getModules);
router.get("/:id", getModuleById);
router.post("/", protect, authorize("admin", "mentor"), createModule);
router.patch("/:id", protect, authorize("admin", "mentor"), updateModule);
router.delete("/:id", protect, authorize("admin"), deleteModule);

export default router;
