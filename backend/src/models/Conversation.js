import mongoose from "mongoose";

const { Schema, model } = mongoose;

const conversationSchema = new Schema({
  type: { type: String, enum: ["direct", "group"], default: "direct" },
  participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  name: { type: String, trim: true },
  lastMessageAt: { type: Date },
  lastMessagePreview: { type: String, trim: true },
  isArchived: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ type: 1, participants: 1 });

export default model("Conversation", conversationSchema);
