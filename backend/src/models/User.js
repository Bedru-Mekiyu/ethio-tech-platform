import mongoose from "mongoose";
import {
  ROLES,
  USER_STATUS,
  MENTOR_STATUS,
  MENTOR_ACCOUNT_STATUS,
  VALID_STATUS_TRANSITIONS,
  VALID_MENTOR_ACCOUNT_TRANSITIONS,
} from "../config/permissions.js";

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
    enum: Object.values(ROLES),
    required: true,
    default: ROLES.STUDENT,
  },

  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.PENDING,
  },
  statusReason: { type: String, trim: true },
  statusChangedAt: { type: Date },
  statusChangedBy: { type: Schema.Types.ObjectId, ref: "User" },

  avatar: { type: String },
  avatarUrl: { type: String },
  avatarType: { type: String, enum: ["uploaded", "default"], default: "default" },
  avatarSource: { type: String, enum: ["cloudinary", "system"], default: "system" },
  avatarPublicId: { type: String, select: false },
  avatarMetadata: {
    originalName: String,
    size: Number,
    mimeType: String,
    width: Number,
    height: Number,
  },

  bio: { type: String, trim: true, maxlength: 1000 },
  phone: { type: String, trim: true },
  city: { type: String, trim: true },
  learningInterests: [{ type: String, trim: true }],
  gradeLevel: { type: Number, min: 8 },

  level: { type: Number, default: 1, min: 1 },
  xp: { type: Number, default: 0, min: 0 },
  credits: { type: Number, default: 0, min: 0 },
  badges: [{ type: Schema.Types.ObjectId, ref: "Badge" }],

  enrolledTracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],

  linkedStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],

  expertise: [String],
  currentCompany: String,
  mentorStatus: {
    type: String,
    enum: Object.values(MENTOR_STATUS),
  },
  mentorAccountStatus: {
    type: String,
    enum: Object.values(MENTOR_ACCOUNT_STATUS),
  },
  linkedApplicationId: { type: Schema.Types.ObjectId, ref: "MentorApplication" },
  mustChangePassword: { type: Boolean, default: false, select: false },
  passwordChangedAt: { type: Date },
  credentialsExpiresAt: { type: Date },
  activationTokenHash: { type: String, select: false },
  activationTokenExpiresAt: { type: Date, select: false },
  termsAcceptedAt: { type: Date },
  onboardingCompletedAt: { type: Date },
  onboardingSteps: {
    passwordChanged: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    photoUploaded: { type: Boolean, default: false },
    availabilitySet: { type: Boolean, default: false },
  },
  mentorScore: { type: Number, default: 0, min: 0 },
  totalSessions: { type: Number, default: 0, min: 0 },
  mentorRating: { type: Number, default: 0, min: 0, max: 5 },
  feedbackScore: { type: Number, default: 0, min: 0, max: 100 },
  attendanceRate: { type: Number, default: 0, min: 0, max: 100 },

  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },

  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  activeSessions: { type: Number, default: 0 },
  devices: [{
    type: { type: String, enum: ["web", "mobile", "desktop"] },
    userAgent: String,
    ip: String,
    lastUsedAt: Date,
  }],

  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  restoredAt: { type: Date },
  restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

  refreshTokenHash: { type: String, select: false },
  refreshTokenExpiresAt: { type: Date, select: false },
  passwordResetHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  loginAttempts: { type: Number, required: true, default: 0, select: false },
  lockUntil: { type: Date, select: false },
}, { timestamps: true });

userSchema.virtual("isDeleted").get(function () {
  return !!this.deletedAt;
});

userSchema.virtual("isActive").get(function () {
  return this.status === USER_STATUS.ACTIVE && !this.deletedAt;
});

userSchema.virtual("isSuspended").get(function () {
  return this.status === USER_STATUS.SUSPENDED;
});

userSchema.methods.canTransitionTo = function (newStatus) {
  const allowed = VALID_STATUS_TRANSITIONS[this.status] || [];
  return allowed.includes(newStatus);
};

userSchema.methods.transitionTo = function (newStatus, { reason, changedBy } = {}) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  this.status = newStatus;
  this.statusReason = reason || undefined;
  this.statusChangedAt = new Date();
  this.statusChangedBy = changedBy;
  return this;
};

userSchema.methods.canTransitionMentorAccount = function (newStatus) {
  if (!this.mentorAccountStatus) return true;
  const allowed = VALID_MENTOR_ACCOUNT_TRANSITIONS[this.mentorAccountStatus] || [];
  return allowed.includes(newStatus);
};

userSchema.methods.transitionMentorAccount = function (newStatus, { reason, changedBy } = {}) {
  if (!this.canTransitionMentorAccount(newStatus)) {
    throw new Error(
      `Cannot transition mentor account from ${this.mentorAccountStatus} to ${newStatus}`
    );
  }
  this.mentorAccountStatus = newStatus;
  if (reason) this.statusReason = reason;
  if (changedBy) this.statusChangedBy = changedBy;
  this.statusChangedAt = new Date();
  return this;
};

userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, xp: -1, level: -1, createdAt: 1 });
userSchema.index({ role: 1, updatedAt: -1 });
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ enrolledTracks: 1 });
userSchema.index({ mentorScore: -1, totalSessions: -1 });
userSchema.index({ fullName: 1 });
userSchema.index({ fullName: "text", email: "text" });
userSchema.index({ mentorStatus: 1, status: 1 });
userSchema.index({ mentorAccountStatus: 1 });
userSchema.index({ linkedApplicationId: 1 }, { sparse: true });
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ deletedAt: 1 }, { sparse: true });
userSchema.index({ createdAt: -1 });

export default model("User", userSchema);
