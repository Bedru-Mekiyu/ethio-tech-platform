import ReminderJob from "../models/ReminderJob.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";
import { notifyUser } from "./notificationService.js";

const REMINDER_WINDOWS = [
  { type: "24h", ms: 24 * 60 * 60 * 1000 },
  { type: "1h", ms: 60 * 60 * 1000 },
  { type: "15min", ms: 15 * 60 * 1000 },
];

export const scheduleReminders = async (sessionId) => {
  const session = await Session.findById(sessionId).select("scheduledAt title status");
  if (!session || session.status === "canceled" || session.status === "ended") return;

  for (const window of REMINDER_WINDOWS) {
    const scheduledAt = new Date(session.scheduledAt.getTime() - window.ms);

    await ReminderJob.findOneAndUpdate(
      { session: sessionId, type: window.type },
      {
        session: sessionId,
        type: window.type,
        scheduledAt,
        status: "pending",
        retryCount: 0,
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
};

export const cancelReminders = async (sessionId) => {
  await ReminderJob.updateMany(
    { session: sessionId, status: "pending" },
    { status: "cancelled" }
  );
};

export const processReminders = async () => {
  const now = new Date();
  const due = await ReminderJob.find({
    status: "pending",
    scheduledAt: { $lte: now },
    retryCount: { $lt: 3 },
  }).limit(50);

  for (const job of due) {
    try {
      const session = await Session.findById(job.session).select("title status scheduledAt");
      if (!session || session.status === "canceled" || session.status === "ended") {
        job.status = "cancelled";
        await job.save();
        continue;
      }

      const participants = await SessionParticipant.find({
        session: job.session,
        status: { $in: ["registered", "joined"] },
      }).select("user");

      for (const participant of participants) {
        await notifyUser({
          recipientId: participant.user,
          type: "session",
          message: `Reminder: "${session.title}" starts in ${job.type}`,
          link: `/sessions/${job.session}`,
        });
      }

      job.status = "sent";
      job.sentAt = new Date();
      await job.save();
    } catch (err) {
      job.retryCount += 1;
      job.lastError = err.message;
      await job.save();
    }
  }

  return due.length;
};

let reminderInterval = null;

export const startReminderEngine = () => {
  if (reminderInterval) return;
  reminderInterval = setInterval(() => {
    processReminders().catch(() => undefined);
  }, 60_000);
  reminderInterval.unref?.();
};

export const stopReminderEngine = () => {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
};
