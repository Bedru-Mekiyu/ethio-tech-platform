import CalendarEvent from "../models/CalendarEvent.js";
import Session from "../models/Session.js";

export const createEvent = async (data) => {
  return CalendarEvent.create(data);
};

export const getStudentEvents = async (userId, startDate, endDate) => {
  const filter = {
    $or: [
      { createdBy: userId },
      { attendees: userId },
    ],
  };

  if (startDate || endDate) {
    filter.startAt = {};
    if (startDate) filter.startAt.$gte = new Date(startDate);
    if (endDate) filter.startAt.$lte = new Date(endDate);
  }

  return CalendarEvent.find(filter)
    .populate("relatedSession", "title scheduledAt status")
    .populate("relatedAssignment", "title dueDate")
    .sort({ startAt: 1 })
    .lean();
};

export const updateEvent = async (eventId, userId, updates) => {
  return CalendarEvent.findOneAndUpdate(
    { _id: eventId, createdBy: userId },
    updates,
    { new: true }
  );
};

export const deleteEvent = async (eventId, userId) => {
  return CalendarEvent.findOneAndDelete({ _id: eventId, createdBy: userId });
};

export const generateSessionEvents = async (userId) => {
  const sessions = await Session.find({
    participants: userId,
    status: { $in: ["scheduled", "live"] },
    scheduledAt: { $gte: new Date() },
  }).select("title scheduledAt durationMinutes status").lean();

  const events = [];
  for (const session of sessions) {
    const existing = await CalendarEvent.findOne({
      relatedSession: session._id,
      createdBy: userId,
    });

    if (!existing) {
      const endAt = session.scheduledAt && session.durationMinutes
        ? new Date(new Date(session.scheduledAt).getTime() + session.durationMinutes * 60000)
        : undefined;

      const event = await CalendarEvent.create({
        title: session.title,
        startAt: session.scheduledAt,
        endAt,
        type: "session",
        color: session.status === "live" ? "#22C55E" : "#3B82F6",
        relatedSession: session._id,
        createdBy: userId,
        attendees: [userId],
      });
      events.push(event);
    }
  }

  return events;
};

export const generateICSEvents = async (userId) => {
  const events = await getStudentEvents(userId);
  return events.map(e => ({
    title: e.title,
    start: e.startAt,
    end: e.endAt,
    description: e.description || "",
    type: e.type,
  }));
};
