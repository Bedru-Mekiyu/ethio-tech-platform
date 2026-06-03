import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  createEvent,
  getStudentEvents,
  updateEvent,
  deleteEvent,
  generateSessionEvents,
  generateICSEvents,
} from "../services/calendarService.js";

export const listEvents = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const events = await getStudentEvents(req.user._id, startDate, endDate);
  sendResponse(res, 200, "Events", { events });
});

export const createNewEvent = asyncHandler(async (req, res) => {
  const { title, description, startAt, endAt, type, color, isAllDay } = req.body;
  if (!title || !startAt) throw new ApiError(400, "Title and startAt are required");

  const event = await createEvent({
    title, description, startAt, endAt, type, color, isAllDay,
    createdBy: req.user._id,
    attendees: [req.user._id],
  });

  sendResponse(res, 201, "Event created", { event });
});

export const updateEventDetails = asyncHandler(async (req, res) => {
  const event = await updateEvent(req.params.id, req.user._id, req.body);
  if (!event) throw new ApiError(404, "Event not found");
  sendResponse(res, 200, "Event updated", { event });
});

export const deleteEventById = asyncHandler(async (req, res) => {
  const event = await deleteEvent(req.params.id, req.user._id);
  if (!event) throw new ApiError(404, "Event not found");
  sendResponse(res, 200, "Event deleted");
});

export const syncSessionEvents = asyncHandler(async (req, res) => {
  const events = await generateSessionEvents(req.user._id);
  sendResponse(res, 200, "Session events synced", { count: events.length });
});

export const exportICS = asyncHandler(async (req, res) => {
  const events = await generateICSEvents(req.user._id);

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EthioTech//Learning Calendar//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    const dtStart = event.start ? new Date(event.start).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : "";
    const dtEnd = event.end ? new Date(event.end).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : "";
    if (!dtStart) continue;

    icsLines.push(
      "BEGIN:VEVENT",
      `DTSTART:${dtStart}`,
      dtEnd ? `DTEND:${dtEnd}` : "",
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
      `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@ethiotech`,
      "END:VEVENT"
    );
  }

  icsLines.push("END:VCALENDAR");

  const ics = icsLines.filter(Boolean).join("\r\n");
  res.setHeader("Content-Type", "text/calendar");
  res.setHeader("Content-Disposition", 'attachment; filename="ethiotech-calendar.ics"');
  res.send(ics);
});
