import mongoose from "mongoose";

const { Schema, model } = mongoose;

const studentProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  cohortId: { type: Schema.Types.ObjectId, ref: "Cohort" },
  trackId: { type: Schema.Types.ObjectId, ref: "Track" },
  totalSessionsAttended: { type: Number, default: 0 },
  totalSessionsAvailable: { type: Number, default: 0 },
  attendanceRate: { type: Number, default: 0 },
  avgEngagementScore: { type: Number, default: 0 },
  totalXpEarned: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastSessionDate: { type: Date },
  modulesCompleted: [{ type: Schema.Types.ObjectId, ref: "Module" }],
  lessonsCompleted: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  projectsCompleted: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  overallProgressPercent: { type: Number, default: 0 },
  lastActivityAt: { type: Date },
  strengths: [String],
  areasForImprovement: [String],
  mentorNotes: { type: String, trim: true },
}, { timestamps: true });

studentProgressSchema.index({ userId: 1, cohortId: 1 }, { unique: true, sparse: true });
studentProgressSchema.index({ userId: 1, trackId: 1 }, { sparse: true });

export default model("StudentProgress", studentProgressSchema);
