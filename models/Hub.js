import mongoose from "mongoose";

const { Schema, model } = mongoose;

const hubSchema = new Schema({
  city: { type: String, required: true },
  address: String,
  capacity: Number,
  mentorInCharge: { type: Schema.Types.ObjectId, ref: "User" },
  computersAvailable: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default model("Hub", hubSchema);