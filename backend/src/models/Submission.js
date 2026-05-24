import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const submissionSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  githubLink: { type: String, match: [urlRegex, "Invalid URL"] },
  deployedUrl: { type: String, match: [urlRegex, "Invalid URL"] },
  files: [String],
  feedback: { type: String, trim: true },
  grade: { type: Number, min: 0 },
  status: { 
    type: String, 
    enum: ["pending", "reviewed", "approved", "rejected"], 
    default: "pending" 
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, trim: true },
}, { timestamps: true });

export default model("Submission", submissionSchema);