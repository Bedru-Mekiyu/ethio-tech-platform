import mongoose from "mongoose";

const { Schema, model } = mongoose;

const xpLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  reason: String,
  sourceType: String,
  sourceId: Schema.Types.ObjectId,
}, { timestamps: true });

export default model("XPLog", xpLogSchema);