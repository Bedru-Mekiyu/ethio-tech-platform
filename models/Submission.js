import mongoose from "mongoose";

const { Schema, model } = mongoose;

const submissionSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  githubLink: String,
  deployedUrl: String,
  files: [String],
  feedback: String,
  grade: Number,
  status: { 
    type: String, 
    enum: ["pending", "reviewed", "approved", "rejected"], 
    default: "pending" 
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model("Submission", submissionSchema);