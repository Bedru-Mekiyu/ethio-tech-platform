import { Router } from "express";
import {
  createHub,
  getAttendance,
  getHubs,
  markAttendance,
  updateHub,
} from "../controllers/hubController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, hubSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/", protect, getHubs);
router.patch("/:id", protect, authorize("admin"), validateRequest({ params: commonSchemas.idParam, body: hubSchemas.update }), updateHub);
router.post("/", protect, authorize("admin"), validateRequest({ body: hubSchemas.create }), createHub);
router.get("/attendance/list", protect, authorize("admin", "mentor"), getAttendance);
router.post("/attendance", protect, authorize("admin", "mentor"), validateRequest({ body: hubSchemas.attendance }), markAttendance);

export default router;
