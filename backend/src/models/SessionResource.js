import mongoose from "mongoose";

const { Schema, model } = mongoose;

const resourceViewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  viewedAt: { type: Date, default: Date.now },
  downloadedAt: { type: Date },
});

const resourceDownloadSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  downloadedAt: { type: Date, default: Date.now },
});

const sessionResourceSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, trim: true, maxlength: 1000 },
  url: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  fileName: { type: String, trim: true },
  fileSize: { type: Number },
  type: {
    type: String,
    enum: ["pdf", "slide", "doc", "video", "link", "github", "image", "other"],
    required: true,
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  views: [resourceViewSchema],
  downloads: [resourceDownloadSchema],
  viewCount: { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

sessionResourceSchema.index({ session: 1, createdAt: -1 });
sessionResourceSchema.index({ uploadedBy: 1, session: 1 });

export default model("SessionResource", sessionResourceSchema);
