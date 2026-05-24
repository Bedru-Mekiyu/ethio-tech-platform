import mongoose from "mongoose";

const { Schema, model } = mongoose;

const mentorApplicationSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    currentRole: { type: String, required: true, trim: true },
    currentCompany: { type: String, trim: true },
    location: { type: String, trim: true },
    yearsExperience: { type: Number, min: 0, max: 60 },
    expertise: {
      type: [{ type: String, trim: true }],
      validate: [
        {
          validator: (value) => Array.isArray(value) && value.length >= 2,
          message: "Expertise must include at least 2 items",
        },
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.every((item) => typeof item === "string" && item.trim().length >= 2),
          message: "Each expertise item must be at least 2 characters",
        },
      ],
    },
    availability: {
      type: String,
      enum: ["weeknights", "weekends", "flexible", "ad-hoc"],
    },
    mentoringStyle: {
      type: [
        {
          type: String,
          enum: ["live-sessions", "project-reviews", "office-hours", "cohort-support"],
        },
      ],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 1,
        message: "Mentoring style must include at least 1 option",
      },
    },
    whyMentor: { type: String, required: true, trim: true },
    linkedin: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "in-review", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewedNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

mentorApplicationSchema.index({ email: 1, status: 1 });

export default model("MentorApplication", mentorApplicationSchema);
