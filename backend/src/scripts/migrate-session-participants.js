import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Session from "../models/Session.js";
import SessionParticipant from "../models/SessionParticipant.js";

async function migrateSessionParticipants() {
  await connectDB();

  const existingCount = await SessionParticipant.countDocuments();
  if (existingCount > 0) {
    console.log(`SessionParticipant collection already has ${existingCount} records. Skipping migration.`);
    await mongoose.disconnect();
    return;
  }

  const sessions = await Session.find({}).lean();
  const participants = [];

  for (const session of sessions) {
    for (const userId of session.participants) {
      participants.push({
        session: session._id,
        user: userId,
        status: "registered",
        role: String(session.mentor) === String(userId) ? "host" : "participant",
        verifiedAttendance: false,
        xpAwarded: true,
      });
    }
  }

  if (participants.length > 0) {
    await SessionParticipant.insertMany(participants, { ordered: false });
    console.log(`Migrated ${participants.length} participants across ${sessions.length} sessions.`);
  } else {
    console.log("No participants to migrate.");
  }

  await mongoose.disconnect();
  console.log("Migration complete.");
}

migrateSessionParticipants().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
