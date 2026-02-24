import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const lessonSchema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, trim: true },
  videoUrl: { type: String, match: [urlRegex, "Invalid URL"] },
  codeSandboxUrl: { type: String, match: [urlRegex, "Invalid URL"] },
  xpReward: { type: Number, default: 40, min: 0 },
  module: { type: Schema.Types.ObjectId, ref: "Module", required: true },
  durationMinutes: { type: Number, min: 1 },
  quiz: [{
    question: String,
    options: [String],
    correctIndex: Number,
  }],
  order: { type: Number, min: 0 },
}, { timestamps: true });

export default model("Lesson", lessonSchema);