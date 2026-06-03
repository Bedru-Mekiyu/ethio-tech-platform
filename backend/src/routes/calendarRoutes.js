import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  listEvents,
  createNewEvent,
  updateEventDetails,
  deleteEventById,
  syncSessionEvents,
  exportICS,
} from "../controllers/calendarController.js";

const router = Router();

router.use(protect);

router.get("/events", listEvents);
router.post("/events", createNewEvent);
router.patch("/events/:id", updateEventDetails);
router.delete("/events/:id", deleteEventById);
router.post("/sync", syncSessionEvents);
router.get("/export", exportICS);

export default router;
