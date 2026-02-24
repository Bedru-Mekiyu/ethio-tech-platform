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
  password: { type: String, required: true },

  role: { 
    type: String, 
    enum: ["student", "mentor", "admin", "parent"], 
    required: true 
  },

  avatar: { type: String, default: "/default-avatar.png" },
  bio: { type: String, trim: true },
  phone: { type: String, trim: true },
  gradeLevel: { type: Number, min: 8 }, // only for students

  // Gamification
  level: { type: Number, default: 1, min: 1 },
  xp: { type: Number, default: 0, min: 0 },
  credits: { type: Number, default: 0, min: 0 },
  badges: [{ type: Schema.Types.ObjectId, ref: "Badge" }],

  // Student fields
  enrolledTracks: [{ type: Schema.Types.ObjectId, ref: "Track" }],

  // Mentor fields
  expertise: [String],
  currentCompany: String,
  mentorScore: { type: Number, default: 0, min: 0 },
  totalSessions: { type: Number, default: 0, min: 0 },

  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default model("User", userSchema);