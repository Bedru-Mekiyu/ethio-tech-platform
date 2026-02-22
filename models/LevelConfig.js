import mongoose from "mongoose";

const { Schema, model } = mongoose;

const levelConfigSchema = new Schema({
  level: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  xpRequired: { type: Number, required: true },
  perks: [String],
}, { timestamps: true });

export default model("LevelConfig", levelConfigSchema);