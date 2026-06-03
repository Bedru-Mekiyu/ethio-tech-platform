import mongoose from "mongoose";

const { Schema, model } = mongoose;

const watchProgressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  watchedSeconds: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  lastWatchedAt: { type: Date },
});

const sessionRecordingSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, trim: true, maxlength: 2000 },
  url: { type: String, required: true, trim: true },
  durationMinutes: { type: Number },
  fileSize: { type: Number },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isPublished: { type: Boolean, default: false },
  watchProgress: [watchProgressSchema],
  totalViews: { type: Number, default: 0 },
  completionCount: { type: Number, default: 0 },
}, { timestamps: true });

sessionRecordingSchema.index({ session: 1, createdAt: -1 });
sessionRecordingSchema.index({ isPublished: 1, session: 1 });

export default model("SessionRecording", sessionRecordingSchema);
