import mongoose from "mongoose";

const { Schema, model } = mongoose;

const pollOptionSchema = new Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  votes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  voteCount: { type: Number, default: 0 },
});

const sessionPollSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  question: { type: String, required: true, trim: true, maxlength: 1000 },
  type: {
    type: String,
    enum: ["single", "multiple", "true_false"],
    required: true,
  },
  options: [pollOptionSchema],
  status: {
    type: String,
    enum: ["active", "closed", "results_published"],
    default: "active",
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  totalVotes: { type: Number, default: 0 },
  closedAt: { type: Date },
  resultsPublishedAt: { type: Date },
}, { timestamps: true });

sessionPollSchema.index({ session: 1, status: 1, createdAt: -1 });

export default model("SessionPoll", sessionPollSchema);
