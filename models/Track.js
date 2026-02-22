import mongoose from "mongoose";

const { Schema, model } = mongoose;

const trackSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ["awareness", "beginner", "intermediate", "advanced"] },
  modules: [{ type: Schema.Types.ObjectId, ref: "Module" }],
  xpReward: { type: Number, default: 500 },
  estimatedWeeks: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default model("Track", trackSchema);