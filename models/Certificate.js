import mongoose from "mongoose";

const { Schema, model } = mongoose;

const certificateSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  track: { type: Schema.Types.ObjectId, ref: "Track" },
  certificateUrl: String,
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model("Certificate", certificateSchema);