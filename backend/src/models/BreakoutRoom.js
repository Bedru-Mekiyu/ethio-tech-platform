import mongoose from "mongoose";

const { Schema, model } = mongoose;

const breakoutRoomSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  parentRoomId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  maxParticipants: { type: Number, default: 10, min: 2 },
  timerSeconds: { type: Number, default: 300, min: 30 },
  timerStartedAt: { type: Date },
  timerEndsAt: { type: Date },
  status: { type: String, enum: ["created", "active", "closed"], default: "created" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

breakoutRoomSchema.index({ sessionId: 1, status: 1 });
breakoutRoomSchema.index({ parentRoomId: 1 });

export default model("BreakoutRoom", breakoutRoomSchema);
