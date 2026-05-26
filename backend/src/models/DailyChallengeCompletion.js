import mongoose from "mongoose";

const { Schema, model } = mongoose;

const dailyChallengeCompletionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    challenge: { type: Schema.Types.ObjectId, ref: "DailyChallenge", required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

dailyChallengeCompletionSchema.index({ user: 1, challenge: 1 }, { unique: true });
dailyChallengeCompletionSchema.index({ user: 1, completedAt: -1 });

export default model("DailyChallengeCompletion", dailyChallengeCompletionSchema);
