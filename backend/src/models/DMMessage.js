import mongoose from "mongoose";

const { Schema, model } = mongoose;

const readByEntry = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  readAt: { type: Date, default: Date.now },
}, { _id: false });

const attachmentSchema = new Schema({
  url: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number },
}, { _id: false });

const dmMessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, trim: true },
  type: { type: String, enum: ["text", "image", "file", "system"], default: "text" },
  readBy: [readByEntry],
  replyTo: { type: Schema.Types.ObjectId, ref: "DMMessage" },
  attachments: [attachmentSchema],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

dmMessageSchema.index({ conversationId: 1, createdAt: -1 });
dmMessageSchema.index({ conversationId: 1, senderId: 1 });

export default model("DMMessage", dmMessageSchema);
