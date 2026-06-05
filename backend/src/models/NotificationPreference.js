import mongoose from "mongoose";

const { Schema, model } = mongoose;

const notificationPreferenceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    preferences: {
      session: { type: Boolean, default: true },
      badge: { type: Boolean, default: true },
      xp: { type: Boolean, default: true },
      mentor: { type: Boolean, default: true },
      project: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
      announcement: { type: Boolean, default: true },
      account_approved: { type: Boolean, default: true },
      account_rejected: { type: Boolean, default: true },
      account_suspended: { type: Boolean, default: true },
      account_banned: { type: Boolean, default: true },
      role_changed: { type: Boolean, default: true },
      mentor_approved: { type: Boolean, default: true },
      mentor_rejected: { type: Boolean, default: true },
      password_reset: { type: Boolean, default: true },
      verification: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

notificationPreferenceSchema.index({ user: 1 });

export default model("NotificationPreference", notificationPreferenceSchema);
