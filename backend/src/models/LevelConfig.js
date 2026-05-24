import mongoose from "mongoose";

const { Schema, model } = mongoose;

const levelConfigSchema = new Schema({
  level: { type: Number, required: true, unique: true, min: 1 },
  title: { type: String, required: true, trim: true },
  xpRequired: { type: Number, required: true, min: 0 },
  perks: [String],
}, { timestamps: true });

export default model("LevelConfig", levelConfigSchema);