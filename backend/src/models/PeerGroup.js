import mongoose from "mongoose";

const { Schema, model } = mongoose;

const peerGroupSchema = new Schema({
  name: { type: String, required: true, trim: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  leader: { type: Schema.Types.ObjectId, ref: "User" },
  groupXP: { type: Number, default: 0, min: 0 },
  track: { type: Schema.Types.ObjectId, ref: "Track", required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default model("PeerGroup", peerGroupSchema);