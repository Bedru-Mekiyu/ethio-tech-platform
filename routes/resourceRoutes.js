import { Router } from "express";
import {
  createResource,
  deleteResource,
  getResourceById,
  getResources,
  updateResource,
} from "../controllers/resourceController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getResources);
router.get("/:id", protect, getResourceById);
router.post("/", protect, authorize("mentor", "admin"), createResource);
router.patch("/:id", protect, authorize("mentor", "admin"), updateResource);
router.delete("/:id", protect, authorize("mentor", "admin"), deleteResource);

export default router;
