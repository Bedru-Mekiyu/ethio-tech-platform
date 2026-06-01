import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
  },
  password: { type: String, required: true, select: false },

  role: { 
    type: String, 
    enum: ["student", "mentor", "admin", "parent"], 
    required: true 
  },

  avatar: { type: String },
  avatarUrl: { type: String },
  avatarType: { type: String, enum: ["uploaded", "default"], default: "default" },
  avatarSource: { type: String, enum: ["cloudinary", "system"], default: "system" },
  avatarPublicId: { type: String, select: false },
  bio: { type: String, trim: true },
  phone: { type: String, trim: true },
  city: { type: String, trim: true },
  learningInterests: [{ type: String, trim: true }],
  gradeLevel: { type: Number, min: 8 }, // only for students

  // Gamification
  level: { type: Number, default: 1, min: 1 },
  xp: { type: Number, default: 0, min: 0 },
  credits: { type: Number, default: 0, min: 0 },
  badges: [{ type: Schema.Types.ObjectId, ref: "Badge" }],

  // Student fields
  enrolledTracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],

  // Parent fields
  linkedStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],

  // Mentor fields
  expertise: [String],
  currentCompany: String,
  mentorStatus: { type: String, enum: ["pending", "approved", "rejected"] },
  mentorScore: { type: Number, default: 0, min: 0 },
  totalSessions: { type: Number, default: 0, min: 0 },

  isVerified: { type: Boolean, default: false },
  refreshTokenHash: { type: String, select: false },
  refreshTokenExpiresAt: { type: Date, select: false },
  passwordResetHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  loginAttempts: { type: Number, required: true, default: 0, select: false },
  lockUntil: { type: Date, select: false },
}, { timestamps: true });

userSchema.index({ role: 1, xp: -1, level: -1, createdAt: 1 });
userSchema.index({ role: 1, updatedAt: -1 });
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ enrolledTracks: 1 });
userSchema.index({ mentorScore: -1, totalSessions: -1 });
userSchema.index({ fullName: 1 });
userSchema.index({ fullName: "text", email: "text" });

export default model("User", userSchema);
