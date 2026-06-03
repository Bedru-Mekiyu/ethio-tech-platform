import mongoose from "mongoose";

const { Schema, model } = mongoose;

const moderationLogSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  action: {
    type: String,
    enum: [
      "message_deleted", "user_muted", "user_timeout",
      "user_unmuted", "user_removed", "user_blocked",
      "spam_detected", "flood_detected", "abuse_reported",
    ],
    required: true,
  },
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  targetUser: { type: Schema.Types.ObjectId, ref: "User" },
  targetMessage: { type: Schema.Types.ObjectId, ref: "ChatMessage" },
  reason: { type: String, trim: true, maxlength: 500 },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String },
  duration: { type: Number },
  expiresAt: { type: Date },
}, { timestamps: true });

moderationLogSchema.index({ session: 1, createdAt: -1 });
moderationLogSchema.index({ targetUser: 1, session: 1 });
moderationLogSchema.index({ action: 1, session: 1 });

export default model("ModerationLog", moderationLogSchema);
