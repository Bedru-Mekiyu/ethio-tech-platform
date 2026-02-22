import mongoose from "mongoose";

const { Schema, model } = mongoose;

const moduleSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  track: { type: Schema.Types.ObjectId, ref: "Track", required: true },
  lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  order: Number,
}, { timestamps: true });

export default model("Module", moduleSchema);