import BreakoutRoom from "../models/BreakoutRoom.js";
import BreakoutAssignment from "../models/BreakoutAssignment.js";
import SessionParticipant from "../models/SessionParticipant.js";

export const createBreakout = async ({ sessionId, parentRoomId, name, maxParticipants, timerSeconds, createdBy }) => {
  const breakout = await BreakoutRoom.create({
    sessionId,
    parentRoomId,
    name,
    maxParticipants: maxParticipants || 10,
    timerSeconds: timerSeconds || 300,
    createdBy,
    status: "created",
  });
  return breakout;
};

export const assignToBreakout = async ({ breakoutId, userId, movedBy }) => {
  const breakout = await BreakoutRoom.findById(breakoutId);
  if (!breakout) throw new Error("Breakout room not found");
  if (breakout.status === "closed") throw new Error("Breakout room is closed");

  const currentCount = await BreakoutAssignment.countDocuments({ breakoutRoomId: breakoutId });
  if (currentCount >= breakout.maxParticipants) {
    throw new Error("Breakout room is full");
  }

  await BreakoutAssignment.findOneAndUpdate(
    { breakoutRoomId: breakoutId, userId },
    { breakoutRoomId: breakoutId, userId, movedBy, movedAt: new Date() },
    { upsert: true }
  );

  return { assigned: true };
};

export const bulkAssign = async ({ sessionId, assignments, movedBy }) => {
  const results = [];
  for (const { breakoutId, userId } of assignments) {
    try {
      await assignToBreakout({ breakoutId, userId, movedBy });
      results.push({ userId, breakoutId, success: true });
    } catch (err) {
      results.push({ userId, breakoutId, success: false, error: err.message });
    }
  }
  return results;
};

export const closeBreakout = async ({ breakoutId, movedBy }) => {
  const breakout = await BreakoutRoom.findByIdAndUpdate(
    breakoutId,
    { status: "closed" },
    { new: true }
  );

  if (breakout) {
    await BreakoutAssignment.deleteMany({ breakoutRoomId: breakoutId });
  }

  return breakout;
};

export const closeAllBreakouts = async ({ sessionId, movedBy }) => {
  const breakouts = await BreakoutRoom.find({ sessionId, status: { $ne: "closed" } });
  for (const b of breakouts) {
    await closeBreakout({ breakoutId: b._id, movedBy });
  }
  return breakouts.length;
};

export const getActiveBreakouts = async (sessionId) => {
  const breakouts = await BreakoutRoom.find({ sessionId, status: { $ne: "closed" } });
  const results = [];
  for (const b of breakouts) {
    const count = await BreakoutAssignment.countDocuments({ breakoutRoomId: b._id });
    results.push({ ...b.toObject(), participantCount: count });
  }
  return results;
};

export const getBreakoutParticipants = async (breakoutId) => {
  const assignments = await BreakoutAssignment.find({ breakoutRoomId: breakoutId })
    .populate("userId", "fullName avatar");
  return assignments.map(a => a.userId);
};

export const startBreakoutTimer = async (breakoutId) => {
  const breakout = await BreakoutRoom.findById(breakoutId);
  if (!breakout) return null;

  const now = new Date();
  const endsAt = new Date(now.getTime() + breakout.timerSeconds * 1000);

  breakout.timerStartedAt = now;
  breakout.timerEndsAt = endsAt;
  breakout.status = "active";
  await breakout.save();

  return breakout;
};
