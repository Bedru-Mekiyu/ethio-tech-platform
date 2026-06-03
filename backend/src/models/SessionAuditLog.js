import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sessionAuditLogSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  action: {
    type: String,
    enum: [
      "created", "updated", "started", "ended", "cancelled", "rescheduled",
      "user_joined", "user_left", "user_admitted", "user_denied",
      "user_promoted_from_waitlist", "xp_awarded", "moderation",
    ],
    required: true,
  },
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  targetUser: { type: Schema.Types.ObjectId, ref: "User" },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String },
}, { timestamps: true });

sessionAuditLogSchema.index({ session: 1, createdAt: -1 });
sessionAuditLogSchema.index({ actor: 1, createdAt: -1 });
sessionAuditLogSchema.index({ action: 1, createdAt: -1 });

export default model("SessionAuditLog", sessionAuditLogSchema);
