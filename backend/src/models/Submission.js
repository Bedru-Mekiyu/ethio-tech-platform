import mongoose from "mongoose";

const { Schema, model } = mongoose;

const urlRegex = /^https?:\/\/\S+$/;

const submissionSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: Schema.Types.ObjectId, ref: "Project" },
  assignment: { type: Schema.Types.ObjectId, ref: "Assignment" },
  githubLink: { type: String, match: [urlRegex, "Invalid URL"] },
  deployedUrl: { type: String, match: [urlRegex, "Invalid URL"] },
  files: [String],
  text: { type: String },
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

submissionSchema.index({ student: 1, createdAt: -1 });
submissionSchema.index({ project: 1, status: 1, createdAt: -1 });
submissionSchema.index({ assignment: 1, student: 1 });
submissionSchema.index({ status: 1, updatedAt: -1 });
submissionSchema.index({ reviewedBy: 1, updatedAt: -1 });
submissionSchema.index({ flagged: 1, status: 1, updatedAt: -1 });

export default model("Submission", submissionSchema);
