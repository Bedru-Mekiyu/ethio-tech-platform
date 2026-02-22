import mongoose from "mongoose";

const { Schema, model } = mongoose;

const badgeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  xpBonus: { type: Number, default: 0 },
  category: { type: String, enum: ["achievement", "skill", "community"] },
});

export default model("Badge", badgeSchema);