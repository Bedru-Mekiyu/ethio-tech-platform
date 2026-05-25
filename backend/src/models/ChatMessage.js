import mongoose from "mongoose";

const { Schema, model } = mongoose;

const chatMessageSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true, trim: true },
    messageId: { type: String },
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

export default model("ChatMessage", chatMessageSchema);
