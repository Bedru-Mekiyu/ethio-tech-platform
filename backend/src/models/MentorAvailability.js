import mongoose from "mongoose";

const { Schema, model } = mongoose;

const mentorAvailabilitySchema = new Schema(
  {
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startMinutes: { type: Number, required: true, min: 0, max: 1439 },
    endMinutes: { type: Number, required: true, min: 1, max: 1440 },
    timezone: { type: String, default: "Africa/Addis_Ababa", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mentorAvailabilitySchema.index({ mentor: 1, dayOfWeek: 1, isActive: 1 });

export default model("MentorAvailability", mentorAvailabilitySchema);
