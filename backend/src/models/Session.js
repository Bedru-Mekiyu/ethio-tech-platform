import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const sessionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60, min: 1 },
    classroomMode: {
      type: String,
      enum: ["standard", "immersive-3d"],
      default: "immersive-3d",
    },
    liveProvider: {
      type: String,
      enum: ["custom", "jitsi", "twilio", "daily", "zoom"],
      default: "jitsi",
    },
    liveRoomId: { type: String, trim: true },
    whiteboardEnabled: { type: Boolean, default: true },
    codeCollabEnabled: { type: Boolean, default: true },
    meetingLink: { type: String, match: [urlRegex, "Invalid URL"] },
    recordingUrl: { type: String, match: [urlRegex, "Invalid URL"] },
    xpPerAttendee: { type: Number, default: 80, min: 0 },
    liveStartedAt: { type: Date },
    liveEndedAt: { type: Date },
    maxParticipants: { type: Number, default: 100, min: 0 },
    admissionMode: { type: String, enum: ["open", "waiting-room"], default: "open" },
    isPublic: { type: Boolean, default: true },
    recordingMode: { type: String, enum: ["none", "cloud", "local"], default: "none" },
    screenShareActive: { type: Boolean, default: false },
    screenShareUserId: { type: Schema.Types.ObjectId, ref: "User" },
    whiteboardRevision: { type: Number, default: 0 },
    cancelReason: { type: String, trim: true },
    rescheduledFrom: { type: Date },
    rescheduledReason: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "registration_closed", "live", "paused", "ended", "canceled", "rescheduled"],
      default: "scheduled",
    },
  },
  { timestamps: true },
);

const VALID_TRANSITIONS = {
  draft: ["scheduled", "canceled"],
  scheduled: ["live", "registration_closed", "canceled", "rescheduled"],
  registration_closed: ["scheduled", "live", "canceled"],
  live: ["paused", "ended", "canceled"],
  paused: ["live", "ended", "canceled"],
  ended: [],
  canceled: [],
  rescheduled: ["scheduled", "canceled"],
};

sessionSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    const prevStatus = this._original?.status;
    if (!prevStatus) {
      return next(new Error("Use transitionTo() to change session status"));
    }
    const allowed = VALID_TRANSITIONS[prevStatus];
    if (allowed && !allowed.includes(this.status)) {
      return next(new Error(`Invalid status transition: ${prevStatus} → ${this.status}`));
    }
  }
  this._original = undefined;
  next();
});

sessionSchema.methods.transitionTo = function (newStatus) {
  const allowed = VALID_TRANSITIONS[this.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${this.status} → ${newStatus}`);
  }
  this._original = { status: this.status };
  this.status = newStatus;
};

sessionSchema.index({ mentor: 1, scheduledAt: 1, status: 1 });
sessionSchema.index({ participants: 1, scheduledAt: 1, status: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });
sessionSchema.index({ liveRoomId: 1 }, { sparse: true });
sessionSchema.index({ title: "text", description: "text" });

export default model("Session", sessionSchema);
