import { Router } from "express";
import {
  createTrack,
  deleteTrack,
  getTrackById,
  getTracks,
  updateTrack,
} from "../controllers/trackController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, trackSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", getTracks);
router.get("/:id", validateRequest({ params: commonSchemas.idParam }), getTrackById);
router.post("/", protect, authorize("admin", "mentor"), validateRequest({ body: trackSchemas.create }), createTrack);
router.patch("/:id", protect, authorize("admin", "mentor"), validateRequest({ params: commonSchemas.idParam, body: trackSchemas.update }), updateTrack);
router.delete("/:id", protect, authorize("admin"), validateRequest({ params: commonSchemas.idParam }), deleteTrack);

export default router;
