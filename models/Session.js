import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const sessionSchema = new Schema({
  title: { type: String, required: true, trim: true },
  mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60, min: 1 },
  meetingLink: { type: String, match: [urlRegex, "Invalid URL"] },
  recordingUrl: { type: String, match: [urlRegex, "Invalid URL"] },
  xpPerAttendee: { type: Number, default: 80, min: 0 },
  status: { 
    type: String, 
    enum: ["scheduled", "live", "ended", "canceled"], 
    default: "scheduled" 
  },
}, { timestamps: true });

export default model("Session", sessionSchema);