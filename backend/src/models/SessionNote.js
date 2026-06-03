import mongoose from "mongoose";

const { Schema, model } = mongoose;

const noteVersionSchema = new Schema({
  content: { type: String, required: true },
  version: { type: Number, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date, default: Date.now },
});

const sessionNoteSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  title: { type: String, trim: true, maxlength: 300, default: "Session Notes" },
  content: { type: String, default: "" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isPublished: { type: Boolean, default: false },
  isStudentNote: { type: Boolean, default: false },
  visibility: { type: String, enum: ["private", "shared", "public"], default: "private" },
  currentVersion: { type: Number, default: 1 },
  versionHistory: [noteVersionSchema],
  resources: [{
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    type: { type: String, enum: ["link", "pdf", "slide", "doc", "video", "github"], default: "link" },
  }],
}, { timestamps: true });

sessionNoteSchema.index({ session: 1, isStudentNote: 1, createdBy: 1 });
sessionNoteSchema.index({ createdBy: 1, session: 1 });

export default model("SessionNote", sessionNoteSchema);
