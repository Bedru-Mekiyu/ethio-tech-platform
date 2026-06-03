import mongoose from "mongoose";

const { Schema, model } = mongoose;

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "system", "mentor", "project", "session", "badge", "xp",
      "account_approved", "account_rejected", "account_suspended",
      "account_unsuspended", "account_banned", "account_reactivated",
      "account_deleted", "account_restored", "role_changed",
      "mentor_approved", "mentor_rejected", "password_reset",
      "verification", "announcement",
    ],
    required: true,
  },
  message: { type: String, required: true, trim: true },
  link: { type: String, trim: true },
  isRead: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default model("Notification", notificationSchema);
