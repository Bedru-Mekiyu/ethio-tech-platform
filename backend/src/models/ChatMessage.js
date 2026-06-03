import mongoose from "mongoose";

const { Schema, model } = mongoose;

const chatMessageSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true, trim: true },
    messageId: { type: String },
    type: {
      type: String,
      enum: ["public", "announcement", "direct", "private_question", "system"],
      default: "public",
    },
    recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    isAnnouncement: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomId: 1, createdAt: -1 });
chatMessageSchema.index(
  { roomId: 1, messageId: 1 },
  {
    unique: true,
    partialFilterExpression: { messageId: { $exists: true } },
  }
);
chatMessageSchema.index({ roomId: 1, type: 1 });
chatMessageSchema.index({ recipientId: 1, createdAt: -1 });

export default model("ChatMessage", chatMessageSchema);
