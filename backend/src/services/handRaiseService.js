import HandRaise from "../models/HandRaise.js";

export const raiseHand = async ({ sessionId, userId }) => {
  const existing = await HandRaise.findOne({ session: sessionId, student: userId });
  if (existing) {
    if (existing.status === "raised") return existing;
    existing.status = "raised";
    existing.queuePosition = await getNextQueuePosition(sessionId);
    existing.calledOnAt = null;
    existing.answeredAt = null;
    await existing.save();
    return existing;
  }

  const position = await getNextQueuePosition(sessionId);
  const handRaise = await HandRaise.create({
    session: sessionId,
    student: userId,
    status: "raised",
    queuePosition: position,
  });
  return handRaise;
};

export const lowerHand = async ({ sessionId, userId }) => {
  const handRaise = await HandRaise.findOne({ session: sessionId, student: userId });
  if (!handRaise) return null;
  handRaise.status = "lowered";
  handRaise.queuePosition = null;
  await handRaise.save();
  return handRaise;
};

export const callOnStudent = async ({ sessionId, userId }) => {
  const handRaise = await HandRaise.findOne({ session: sessionId, student: userId, status: "raised" });
  if (!handRaise) throw new Error("Student has not raised hand");
  handRaise.status = "called_on";
  handRaise.calledOnAt = new Date();
  await handRaise.save();
  return handRaise;
};

export const markAnswered = async ({ sessionId, userId }) => {
  const handRaise = await HandRaise.findOne({ session: sessionId, student: userId });
  if (!handRaise) return null;
  handRaise.status = "answered";
  handRaise.answeredAt = new Date();
  await handRaise.save();
  return handRaise;
};

export const getRaisedHandsQueue = async (sessionId) => {
  const queue = await HandRaise.find({ session: sessionId, status: "raised" })
    .populate("student", "fullName avatar")
    .sort({ queuePosition: 1, createdAt: 1 });
  return queue;
};

export const getHandRaiseCount = async (sessionId) => {
  return HandRaise.countDocuments({ session: sessionId, status: "raised" });
};

const getNextQueuePosition = async (sessionId) => {
  const last = await HandRaise.findOne({ session: sessionId })
    .sort({ queuePosition: -1 })
    .select("queuePosition");
  return (last?.queuePosition || 0) + 1;
};

export const clearAllHands = async (sessionId) => {
  await HandRaise.updateMany(
    { session: sessionId, status: "raised" },
    { $set: { status: "lowered", queuePosition: null } }
  );
  return { cleared: true };
};
