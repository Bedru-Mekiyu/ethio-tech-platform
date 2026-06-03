import mongoose from "mongoose";

const { Schema, model } = mongoose;

const mentorStudentFeedbackSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  participationScore: { type: Number, required: true, min: 1, max: 5 },
  communicationScore: { type: Number, required: true, min: 1, max: 5 },
  professionalismScore: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });

mentorStudentFeedbackSchema.index({ session: 1, student: 1 }, { unique: true });
mentorStudentFeedbackSchema.index({ mentor: 1, createdAt: -1 });
mentorStudentFeedbackSchema.index({ student: 1, createdAt: -1 });

export default model("MentorStudentFeedback", mentorStudentFeedbackSchema);
