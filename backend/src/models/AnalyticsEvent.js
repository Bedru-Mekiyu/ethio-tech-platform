import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        "lesson_completed",
        "session_joined",
        "assignment_submitted",
        "page_viewed",
        "badge_earned",
        "xp_granted",
        "track_enrolled",
        "course_completed",
        "login",
        "logout",
        "search",
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    projectSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
    },
    source: {
      type: String,
      enum: ["web", "mobile", "api", "socket"],
      default: "web",
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ event: 1, createdAt: -1 });
analyticsEventSchema.index({ user: 1, createdAt: -1 });
analyticsEventSchema.index({ event: 1, user: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

export default AnalyticsEvent;
