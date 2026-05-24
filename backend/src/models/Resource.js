import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const resourceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  fileUrl: { type: String, match: [urlRegex, "Invalid URL"] },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  minLevelRequired: { type: Number, min: 1 },
  tags: [String],
}, { timestamps: true });

export default model("Resource", resourceSchema);