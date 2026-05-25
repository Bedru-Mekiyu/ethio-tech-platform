import mongoose from "mongoose";

const { Schema, model } = mongoose;

const badgeSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  icon: String,
  xpRequired: { type: Number, default: 0, min: 0 },
  xpBonus: { type: Number, default: 0, min: 0 },
  category: { type: String, enum: ["achievement", "skill", "community"] },
}, { timestamps: true });

badgeSchema.index({ xpRequired: 1 });

export default model("Badge", badgeSchema);