import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userStreakSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String },
  },
  { timestamps: true }
);

export default model("UserStreak", userStreakSchema);
