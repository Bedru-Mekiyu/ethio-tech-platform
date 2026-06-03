import SessionRecording from "../models/SessionRecording.js";

export const createRecording = async ({ sessionId, userId, title, description, url, durationMinutes, fileSize }) => {
  const recording = await SessionRecording.create({
    session: sessionId,
    title: title.trim(),
    description: description?.trim(),
    url,
    durationMinutes,
    fileSize,
    uploadedBy: userId,
  });
  return recording;
};

export const updateRecording = async ({ recordingId, userId, updates }) => {
  const recording = await SessionRecording.findOne({ _id: recordingId, uploadedBy: userId });
  if (!recording) throw new Error("Recording not found or not yours");
  const allowed = ["title", "description", "url", "durationMinutes", "fileSize", "isPublished"];
  for (const field of allowed) {
    if (updates[field] !== undefined) recording[field] = updates[field];
  }
  await recording.save();
  return recording;
};

export const publishRecording = async ({ recordingId }) => {
  const recording = await SessionRecording.findById(recordingId);
  if (!recording) throw new Error("Recording not found");
  recording.isPublished = true;
  await recording.save();
  return recording;
};

export const deleteRecording = async ({ recordingId, userId }) => {
  const recording = await SessionRecording.findOne({ _id: recordingId, uploadedBy: userId });
  if (!recording) throw new Error("Recording not found or not yours");
  await recording.deleteOne();
  return { deleted: true };
};

export const getSessionRecordings = async (sessionId, includeUnpublished = false) => {
  const filter = { session: sessionId };
  if (!includeUnpublished) filter.isPublished = true;
  return SessionRecording.find(filter)
    .populate("uploadedBy", "fullName")
    .sort({ createdAt: -1 });
};

export const recordWatchProgress = async ({ recordingId, userId, progressPercent }) => {
  const recording = await SessionRecording.findById(recordingId);
  if (!recording) throw new Error("Recording not found");
  const existing = recording.watchProgress.find((wp) => String(wp.user) === String(userId));
  if (existing) {
    existing.progressPercent = Math.max(existing.progressPercent, progressPercent);
    existing.lastWatchedAt = new Date();
    if (progressPercent >= 90 && !existing.completed) {
      existing.completed = true;
      recording.completionCount += 1;
    }
  } else {
    recording.watchProgress.push({
      user: userId,
      progressPercent,
      completed: progressPercent >= 90,
      lastWatchedAt: new Date(),
    });
    recording.totalViews += 1;
    if (progressPercent >= 90) recording.completionCount += 1;
  }
  await recording.save();
  return recording;
};

export const getRecordingStats = async (sessionId) => {
  const recordings = await SessionRecording.find({ session: sessionId });
  return {
    total: recordings.length,
    published: recordings.filter((r) => r.isPublished).length,
    totalViews: recordings.reduce((sum, r) => sum + r.totalViews, 0),
    totalCompletions: recordings.reduce((sum, r) => sum + r.completionCount, 0),
  };
};
