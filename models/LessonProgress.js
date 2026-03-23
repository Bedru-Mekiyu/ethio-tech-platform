import mongoose from "mongoose";

const { Schema, model } = mongoose;

const lessonProgressSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lesson: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
  completedAt: { type: Date, default: Date.now },
  xpAwarded: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

export default model("LessonProgress", lessonProgressSchema);