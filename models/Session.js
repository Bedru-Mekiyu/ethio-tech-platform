import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sessionSchema = new Schema({
  title: { type: String, required: true },
  mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  meetingLink: String,
  recordingUrl: String,
  xpPerAttendee: { type: Number, default: 80 },
  status: { 
    type: String, 
    enum: ["scheduled", "live", "ended", "canceled"], 
    default: "scheduled" 
  },
}, { timestamps: true });

export default model("Session", sessionSchema);