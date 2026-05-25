import mongoose from "mongoose";

const { Schema, model } = mongoose;

const trackSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ["awareness", "beginner", "intermediate", "advanced"] },
  modules: [{ type: Schema.Types.ObjectId, ref: "Module" }],
  xpReward: { type: Number, default: 500, min: 0 },
  estimatedWeeks: { type: Number, min: 1 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

trackSchema.index({ isActive: 1, category: 1, createdAt: -1 });
trackSchema.index({ category: 1, xpReward: -1 });

export default model("Track", trackSchema);
