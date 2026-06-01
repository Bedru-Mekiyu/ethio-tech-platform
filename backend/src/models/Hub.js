import mongoose from "mongoose";

const { Schema, model } = mongoose;

const hubSchema = new Schema(
  {
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    capacity: { type: Number, min: 0 },
    mentorInCharge: { type: Schema.Types.ObjectId, ref: "User" },
    computersAvailable: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

hubSchema.index({ city: 1 });
hubSchema.index({ isActive: 1 });
hubSchema.index({ mentorInCharge: 1 });

export default model("Hub", hubSchema);
