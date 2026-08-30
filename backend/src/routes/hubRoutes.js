import { Router } from "express";
import {
  bookHub,
  checkInHub,
  createHub,
  getAttendance,
  getHubAvailability,
  getHubs,
  getMyBookings,
  markAttendance,
  updateHub,
} from "../controllers/hubController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { commonSchemas, hubSchemas } from "../validators/schemas.js";

const router = Router();

router.get("/bookings/me", protect, getMyBookings);
router.post("/book", protect, validateRequest({ body: hubSchemas.book }), bookHub);
router.post("/checkin", protect, validateRequest({ body: hubSchemas.checkin }), checkInHub);
router.get(
  "/:id/availability",
  protect,
  validateRequest({ params: commonSchemas.idParam, query: hubSchemas.availabilityQuery }),
  getHubAvailability
);

router.get("/attendance/list", protect, authorize("admin", "mentor"), getAttendance);
router.post(
  "/attendance",
  protect,
  authorize("admin", "mentor"),
  validateRequest({ body: hubSchemas.attendance }),
  markAttendance
);

router.get("/", protect, getHubs);
router.post("/", protect, authorize("admin"), validateRequest({ body: hubSchemas.create }), createHub);
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateRequest({ params: commonSchemas.idParam, body: hubSchemas.update }),
  updateHub
);

export default router;
