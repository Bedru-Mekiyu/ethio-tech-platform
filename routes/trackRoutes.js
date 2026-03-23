import { Router } from "express";
import {
  createTrack,
  deleteTrack,
  getTrackById,
  getTracks,
  updateTrack,
} from "../controllers/trackController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getTracks);
router.get("/:id", getTrackById);
router.post("/", protect, authorize("admin", "mentor"), createTrack);
router.patch("/:id", protect, authorize("admin", "mentor"), updateTrack);
router.delete("/:id", protect, authorize("admin"), deleteTrack);

export default router;
