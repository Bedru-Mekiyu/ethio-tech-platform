import mongoose from "mongoose";

const { Schema, model } = mongoose;

const resourceSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  fileUrl: String,
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  minLevelRequired: Number,
  tags: [String],
}, { timestamps: true });

export default model("Resource", resourceSchema);