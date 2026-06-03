import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sessionQuestionSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ["pending", "answering", "answered", "archived"],
    default: "pending",
  },
  isPinned: { type: Boolean, default: false },
  upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  upvoteCount: { type: Number, default: 0 },
  reply: {
    text: { type: String, trim: true, maxlength: 3000 },
    repliedBy: { type: Schema.Types.ObjectId, ref: "User" },
    repliedAt: { type: Date },
  },
  answeredAt: { type: Date },
  archivedAt: { type: Date },
}, { timestamps: true });

sessionQuestionSchema.index({ session: 1, status: 1, upvoteCount: -1 });
sessionQuestionSchema.index({ session: 1, isPinned: -1 });
sessionQuestionSchema.index({ student: 1, session: 1 });

export default model("SessionQuestion", sessionQuestionSchema);
