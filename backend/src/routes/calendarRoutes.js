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
router.put("/events/:id", updateEventDetails);
router.patch("/events/:id", updateEventDetails);
router.delete("/events/:id", deleteEventById);
router.post("/sync", syncSessionEvents);
router.post("/sync-sessions", syncSessionEvents);
router.get("/export", exportICS);
router.get("/ical", exportICS);

export default router;
