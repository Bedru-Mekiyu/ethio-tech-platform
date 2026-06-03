import mongoose from "mongoose";

const { Schema, model } = mongoose;

const waitlistEntrySchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  position: { type: Number, required: true },
  status: {
    type: String,
    enum: ["waiting", "promoted", "expired", "cancelled"],
    default: "waiting",
  },
  notifiedAt: { type: Date },
  promotedAt: { type: Date },
  expiresAt: { type: Date },
}, { timestamps: true });

waitlistEntrySchema.index({ session: 1, position: 1 }, { unique: true });
waitlistEntrySchema.index({ session: 1, status: 1 });
waitlistEntrySchema.index({ user: 1, session: 1 }, { unique: true });

export default model("WaitlistEntry", waitlistEntrySchema);
