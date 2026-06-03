import mongoose from "mongoose";

const { Schema, model } = mongoose;

const adminActivityLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: Schema.Types.ObjectId },
  targetUser: { type: Schema.Types.ObjectId, ref: "User" },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
  duration: { type: Number },
}, { timestamps: true });

adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ actor: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1, createdAt: -1 });
adminActivityLogSchema.index({ resource: 1, resourceId: 1 });
adminActivityLogSchema.index({ targetUser: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1, resource: 1, createdAt: -1 });

export default model("AdminActivityLog", adminActivityLogSchema);
