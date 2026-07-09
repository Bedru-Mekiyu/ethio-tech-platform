import mongoose from "mongoose";

const { Schema, model } = mongoose;

const mentorApplicationSchema = new Schema({
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
  cvUrl: { type: String, trim: true },
  documents: [{ name: String, url: String }],
  socialLinks: {
    github: String,
    twitter: String,
    website: String,
  },
  status: {
    type: String,
    enum: ["pending_review", "approved", "rejected", "changes_requested", "archived"],
    default: "pending_review",
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  reviewNotes: { type: String, trim: true },
  rejectionReason: { type: String, trim: true },
  rejectionHistory: [{
    reason: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  }],
  previousApplicationId: { type: Schema.Types.ObjectId, ref: "MentorApplication" },
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  provisionedAt: { type: Date },
  provisionedBy: { type: Schema.Types.ObjectId, ref: "User" },
  credentialsSentAt: { type: Date },
  credentialsDeliveryMethod: {
    type: String,
    enum: ["email", "activation_link", "manual"],
  },
  reviewStartedAt: { type: Date },
  reviewStartedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

mentorApplicationSchema.index({ email: 1, status: 1 });
mentorApplicationSchema.index({ status: 1, createdAt: -1 });
mentorApplicationSchema.index({ expertise: 1 });
mentorApplicationSchema.index({ yearsExperience: 1 });

export default model("MentorApplication", mentorApplicationSchema);
