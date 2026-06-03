import mongoose from "mongoose";

const { Schema, model } = mongoose;

const auditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  resource: { type: String },
  resourceId: { type: Schema.Types.ObjectId },
  targetUser: { type: Schema.Types.ObjectId, ref: "User" },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, resource: 1, createdAt: -1 });
auditLogSchema.index({ targetUser: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

export default model("AuditLog", auditLogSchema);
