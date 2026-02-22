import mongoose from "mongoose";

const { Schema, model } = mongoose;

const lessonSchema = new Schema({
  title: { type: String, required: true },
  content: String,
  videoUrl: String,
  codeSandboxUrl: String,
  xpReward: { type: Number, default: 40 },
  module: { type: Schema.Types.ObjectId, ref: "Module", required: true },
  durationMinutes: Number,
  quiz: [{
    question: String,
    options: [String],
    correctIndex: Number,
  }],
  order: Number,
}, { timestamps: true });

export default model("Lesson", lessonSchema);