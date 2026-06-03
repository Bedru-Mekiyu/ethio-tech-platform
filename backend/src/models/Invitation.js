import mongoose from "mongoose";

const { Schema, model } = mongoose;

const invitationSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  inviter: { type: Schema.Types.ObjectId, ref: "User", required: true },
  invitee: { type: Schema.Types.ObjectId, ref: "User" },
  method: {
    type: String,
    enum: ["direct", "cohort", "track", "mentor", "link"],
    required: true,
  },
  cohortId: { type: Schema.Types.ObjectId, ref: "Track" },
  trackId: { type: Schema.Types.ObjectId, ref: "Track" },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "expired"],
    default: "pending",
  },
  expiresAt: { type: Date },
  message: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

invitationSchema.index({ session: 1, invitee: 1 }, { unique: true, sparse: true });
invitationSchema.index({ invitee: 1, status: 1 });
invitationSchema.index({ status: 1, expiresAt: 1 });

export default model("Invitation", invitationSchema);
