import mongoose from "mongoose";

const { Schema, model } = mongoose;

const certificateSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  track: { type: Schema.Types.ObjectId, ref: "Track", required: true },
  certificateUrl: { type: String, match: [/^https?:\/\/\S+$/, "Invalid URL"], trim: true },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

certificateSchema.index({ student: 1, track: 1 }, { unique: true });

export default model("Certificate", certificateSchema);