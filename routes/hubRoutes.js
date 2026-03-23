import { Router } from "express";
import {
  createHub,
  getAttendance,
  getHubs,
  markAttendance,
  updateHub,
} from "../controllers/hubController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, getHubs);
router.patch("/:id", protect, authorize("admin"), updateHub);
router.post("/", protect, authorize("admin"), createHub);
router.get("/attendance/list", protect, authorize("admin", "mentor"), getAttendance);
router.post("/attendance", protect, authorize("admin", "mentor"), markAttendance);

export default router;
