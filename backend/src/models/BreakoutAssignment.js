import mongoose from "mongoose";

const { Schema, model } = mongoose;

const breakoutAssignmentSchema = new Schema({
  breakoutRoomId: { type: Schema.Types.ObjectId, ref: "BreakoutRoom", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedAt: { type: Date, default: Date.now },
  movedBy: { type: Schema.Types.ObjectId, ref: "User" },
  movedAt: { type: Date },
}, { timestamps: true });

breakoutAssignmentSchema.index({ breakoutRoomId: 1, userId: 1 }, { unique: true });

export default model("BreakoutAssignment", breakoutAssignmentSchema);
