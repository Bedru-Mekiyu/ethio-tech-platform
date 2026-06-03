import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reminderJobSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  scheduledAt: { type: Date, required: true },
  type: {
    type: String,
    enum: ["24h", "1h", "15min"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "sent", "failed", "cancelled"],
    default: "pending",
  },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  lastError: { type: String },
  sentAt: { type: Date },
}, { timestamps: true });

reminderJobSchema.index({ status: 1, scheduledAt: 1 });
reminderJobSchema.index({ session: 1, type: 1 }, { unique: true });

export default model("ReminderJob", reminderJobSchema);
