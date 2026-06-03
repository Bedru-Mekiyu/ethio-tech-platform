import mongoose from "mongoose";

const { Schema, model } = mongoose;

const cohortSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  track: { type: Schema.Types.ObjectId, ref: "Track" },
  students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
  maxStudents: { type: Number, default: 50 },
  tags: [{ type: String, trim: true }],
}, { timestamps: true });

cohortSchema.index({ mentor: 1, status: 1 });
cohortSchema.index({ track: 1 });

export default model("Cohort", cohortSchema);
