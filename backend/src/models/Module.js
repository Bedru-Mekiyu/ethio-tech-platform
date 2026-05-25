import mongoose from "mongoose";

const { Schema, model } = mongoose;

const moduleSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  track: { type: Schema.Types.ObjectId, ref: "Track", required: true },
  lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  order: { type: Number, min: 0 },
}, { timestamps: true });

moduleSchema.index({ track: 1, order: 1, createdAt: 1 });

export default model("Module", moduleSchema);
