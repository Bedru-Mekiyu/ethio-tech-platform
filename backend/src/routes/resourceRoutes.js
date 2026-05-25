import { Router } from "express";
import {
  createResource,
  deleteResource,
  getResourceById,
  getResources,
  updateResource,
} from "../controllers/resourceController.js";
import { authorize, protect, requireVerifiedMentor } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getResources);
router.get("/:id", protect, getResourceById);
router.post("/", protect, authorize("mentor", "admin"), requireVerifiedMentor, createResource);
router.patch("/:id", protect, authorize("mentor", "admin"), requireVerifiedMentor, updateResource);
router.delete("/:id", protect, authorize("mentor", "admin"), requireVerifiedMentor, deleteResource);

export default router;
