import mongoose from "mongoose";

const { Schema, model } = mongoose;

const hubAttendanceSchema = new Schema({
  hub: { type: Schema.Types.ObjectId, ref: "Hub", required: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  xpAwarded: { type: Number, default: 50, min: 0 },
}, { timestamps: true });

hubAttendanceSchema.index({ hub: 1, student: 1, date: 1 }, { unique: true });

export default model("HubAttendance", hubAttendanceSchema);