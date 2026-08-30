import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recurrenceSchema = new Schema(
  {
    frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
    interval: { type: Number, default: 1 },
    endDate: { type: Date },
  },
  { _id: false },
);

const calendarEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date },
    type: {
      type: String,
      enum: ["session", "deadline", "milestone", "office_hours", "study_block", "hub_visit", "custom"],
      default: "custom",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    targetTrack: { type: String, trim: true },
    capstoneProject: { type: String, trim: true },
    color: { type: String, default: "#6366F1" },
    relatedSession: { type: Schema.Types.ObjectId, ref: "Session" },
    relatedAssignment: { type: Schema.Types.ObjectId, ref: "Assignment" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isAllDay: { type: Boolean, default: false },
    recurrence: recurrenceSchema,
  },
  { timestamps: true },
);

calendarEventSchema.index({ createdBy: 1, startAt: 1 });
calendarEventSchema.index({ attendees: 1, startAt: 1 });
calendarEventSchema.index({ relatedSession: 1 });

export default model("CalendarEvent", calendarEventSchema);
