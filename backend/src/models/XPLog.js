import mongoose from "mongoose";

const { Schema, model } = mongoose;

const xpLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  reason: String,
  sourceType: {
    type: String,
    enum: ["lesson", "project", "session", "hub", "badge", "manual"],
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    required: function () {
      return !!this.sourceType;
    },
  },
}, { timestamps: true });

xpLogSchema.index(
  { user: 1, sourceType: 1, sourceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceType: { $exists: true },
      sourceId: { $exists: true },
    },
  }
);
xpLogSchema.index({ user: 1, createdAt: -1 });
xpLogSchema.index({ sourceType: 1, createdAt: -1 });

export default model("XPLog", xpLogSchema);
