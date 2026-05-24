import mongoose from "mongoose";

const { Schema, model } = mongoose;

const dailyChallengeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    xpReward: { type: Number, default: 25, min: 0 },
    activeDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("DailyChallenge", dailyChallengeSchema);
