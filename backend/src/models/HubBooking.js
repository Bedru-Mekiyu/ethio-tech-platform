import mongoose from "mongoose";
import crypto from "crypto";

const { Schema, model } = mongoose;

const hubBookingSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hub: {
      type: Schema.Types.ObjectId,
      ref: "Hub",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      enum: ["morning", "afternoon", "fullday"],
      required: true,
      default: "morning",
    },
    workstationNumber: {
      type: Number,
      min: 1,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "workstation",
    },
    status: {
      type: String,
      enum: ["booked", "checked_in", "completed", "cancelled"],
      default: "booked",
      index: true,
    },
    checkInTime: {
      type: Date,
    },
    passCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: () => crypto.randomBytes(3).toString("hex").toUpperCase(),
      index: true,
    },
  },
  { timestamps: true }
);

hubBookingSchema.pre("validate", function (next) {
  if (!this.passCode) {
    this.passCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  }
  if (typeof next === "function") {
    next();
  }
});

hubBookingSchema.index({ hub: 1, date: 1, timeSlot: 1 });
hubBookingSchema.index({ student: 1, date: 1 });
hubBookingSchema.index({ student: 1, status: 1 });
hubBookingSchema.index({ hub: 1, date: 1, status: 1 });

export default model("HubBooking", hubBookingSchema);
