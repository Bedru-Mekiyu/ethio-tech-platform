import mongoose from "mongoose";

const { Schema, model } = mongoose;

const projectSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  track: { type: Schema.Types.ObjectId, ref: "Track" },
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  xpReward: { type: Number, default: 400 },
  githubTemplate: String,
  requirements: [String],
}, { timestamps: true });

export default model("Project", projectSchema);