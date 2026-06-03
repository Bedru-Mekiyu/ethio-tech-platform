import mongoose from "mongoose";

const { Schema, model } = mongoose;

const engagementScoreSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  questionsAsked: { type: Number, default: 0 },
  pollParticipations: { type: Number, default: 0 },
  chatMessages: { type: Number, default: 0 },
  attendanceMs: { type: Number, default: 0 },
  handsRaised: { type: Number, default: 0 },
  resourcesViewed: { type: Number, default: 0 },
  score: { type: Number, default: 0, min: 0, max: 100 },
  lastCalculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

engagementScoreSchema.index({ session: 1, student: 1 }, { unique: true });
engagementScoreSchema.index({ session: 1, score: -1 });

export default model("EngagementScore", engagementScoreSchema);
