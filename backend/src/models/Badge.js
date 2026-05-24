import mongoose from "mongoose";

const { Schema, model } = mongoose;

const badgeSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  icon: String,
  xpBonus: { type: Number, default: 0, min: 0 },
  category: { type: String, enum: ["achievement", "skill", "community"] },
}, { timestamps: true });

export default model("Badge", badgeSchema);