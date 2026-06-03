import mongoose from "mongoose";

const { Schema, model } = mongoose;

const rubricItemSchema = new Schema({
  criteria: { type: String, required: true },
  maxPoints: { type: Number, required: true },
  description: { type: String },
}, { _id: false });

const attachmentSchema = new Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
}, { _id: false });

const assignmentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  instructions: { type: String },
  track: { type: Schema.Types.ObjectId, ref: "Track" },
  module: { type: Schema.Types.ObjectId, ref: "Module" },
  lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
  mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dueDate: { type: Date },
  maxScore: { type: Number, default: 100 },
  rubric: [rubricItemSchema],
  attachments: [attachmentSchema],
  xpReward: { type: Number, default: 0 },
  allowLateSubmission: { type: Boolean, default: true },
  latePenaltyPercent: { type: Number, default: 10, min: 0, max: 100 },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
  assignToAll: { type: Boolean, default: false },
}, { timestamps: true });

assignmentSchema.index({ mentor: 1, status: 1 });
assignmentSchema.index({ track: 1, status: 1 });
assignmentSchema.index({ dueDate: 1, status: 1 });

export default model("Assignment", assignmentSchema);
