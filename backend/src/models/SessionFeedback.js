import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sessionFeedbackSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  quality: { type: Number, required: true, min: 1, max: 5 },
  engagement: { type: Number, required: true, min: 1, max: 5 },
  impact: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
}, { timestamps: true });

sessionFeedbackSchema.index({ session: 1, student: 1 }, { unique: true });

export default model("SessionFeedback", sessionFeedbackSchema);