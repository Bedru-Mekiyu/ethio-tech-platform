import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const projectSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  track: { type: Schema.Types.ObjectId, ref: "Track", required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  xpReward: { type: Number, default: 400, min: 0 },
  githubTemplate: { type: String, match: [urlRegex, "Invalid URL"] },
  requirements: [String],
}, { timestamps: true });

export default model("Project", projectSchema);