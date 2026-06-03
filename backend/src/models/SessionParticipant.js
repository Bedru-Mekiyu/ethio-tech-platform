import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sessionParticipantSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["invited", "registered", "joined", "active", "completed", "absent", "declined", "waitlisted"],
    default: "registered",
  },
  role: {
    type: String,
    enum: ["host", "cohost", "moderator", "participant", "observer"],
    default: "participant",
  },
  joinedAt: { type: Date },
  leftAt: { type: Date },
  lastHeartbeatAt: { type: Date },
  totalPresenceMs: { type: Number, default: 0 },
  verifiedAttendance: { type: Boolean, default: false },
  attendedThreshold: { type: Boolean, default: false },
  xpAwarded: { type: Boolean, default: false },
  xpAwardedAt: { type: Date },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
  waitlistPosition: { type: Number },
  waitlistPromotedAt: { type: Date },
  admissionStatus: {
    type: String,
    enum: ["waiting", "admitted", "denied"],
  },
  metadata: { type: Schema.Types.Mixed },
  reconnectionCount: { type: Number, default: 0 },
  lastReconnectedAt: { type: Date },
  liveStatus: {
    type: String,
    enum: ["active", "idle", "disconnected", "reconnected", "speaking", "hand_raised"],
    default: "disconnected",
  },
  speakingPermission: { type: Boolean, default: false },
  blockedAt: { type: Date },
  blockedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

sessionParticipantSchema.index({ session: 1, user: 1 }, { unique: true });
sessionParticipantSchema.index({ session: 1, status: 1 });
sessionParticipantSchema.index({ user: 1, status: 1, createdAt: -1 });
sessionParticipantSchema.index({ session: 1, admissionStatus: 1 });

export default model("SessionParticipant", sessionParticipantSchema);
