import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const sessionSchema = new Schema({
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
    enum: ["custom", "agora", "twilio", "daily", "zoom"],
    default: "custom",
  },
  liveRoomId: { type: String, trim: true },
  whiteboardEnabled: { type: Boolean, default: true },
  codeCollabEnabled: { type: Boolean, default: true },
  meetingLink: { type: String, match: [urlRegex, "Invalid URL"] },
  recordingUrl: { type: String, match: [urlRegex, "Invalid URL"] },
  xpPerAttendee: { type: Number, default: 80, min: 0 },
  liveStartedAt: { type: Date },
  liveEndedAt: { type: Date },
  status: { 
    type: String, 
    enum: ["scheduled", "live", "ended", "canceled"], 
    default: "scheduled" 
  },
}, { timestamps: true });

sessionSchema.index({ mentor: 1, scheduledAt: 1, status: 1 });
sessionSchema.index({ participants: 1, scheduledAt: 1, status: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });
sessionSchema.index({ liveRoomId: 1 }, { sparse: true });

export default model("Session", sessionSchema);
