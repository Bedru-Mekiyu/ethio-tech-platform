import mongoose from "mongoose";

const { Schema, model } = mongoose;

const handRaiseSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["raised", "lowered", "called_on", "answered"],
    default: "raised",
  },
  calledOnAt: { type: Date },
  answeredAt: { type: Date },
  queuePosition: { type: Number },
}, { timestamps: true });

handRaiseSchema.index({ session: 1, status: 1, queuePosition: 1 });
handRaiseSchema.index({ session: 1, student: 1 }, { unique: true });

export default model("HandRaise", handRaiseSchema);
