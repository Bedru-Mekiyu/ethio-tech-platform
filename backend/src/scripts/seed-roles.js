import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Track from "../models/Track.js";
import { ROLES, USER_STATUS, MENTOR_STATUS, MENTOR_ACCOUNT_STATUS } from "../config/permissions.js";

export const seedRoleUsers = async ({ verbose = true } = {}) => {
  const log = (...args) => {
    if (verbose) console.log(...args);
  };

  const hashedPassword = bcrypt.hashSync("Passw0rd!", 10);
  const now = new Date();

  // Find a track for student enrollment if available
  const sampleTrack = await Track.findOne().select("_id");
  const enrolledTracks = sampleTrack ? [sampleTrack._id] : [];

  // 1. Seed Student First (so parent can link to student)
  const student = await User.findOneAndUpdate(
    { email: "student@ethiotech.com" },
    {
      $set: {
        fullName: "Abebe Kebede",
        password: hashedPassword,
        role: ROLES.STUDENT,
        status: USER_STATUS.ACTIVE,
        isVerified: true,
        verifiedAt: now,
        gradeLevel: 11,
        city: "Addis Ababa",
        xp: 2450,
        level: 5,
        credits: 120,
        enrolledTracks,
        learningInterests: ["Fullstack Web Development", "Cloud Architecture"],
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // 2. Define all role specifications
  const roleDefinitions = [
    {
      email: "superadmin@ethiotech.com",
      fullName: "Super Administrator",
      role: ROLES.SUPER_ADMIN,
      bio: "Global platform super administrator with unrestricted governance.",
      city: "Addis Ababa",
    },
    {
      email: "admin@ethiotech.com",
      fullName: "Platform Administrator",
      role: ROLES.ADMIN,
      bio: "Platform administrator managing community, content, and users.",
      city: "Addis Ababa",
    },
    {
      email: "moderator@ethiotech.com",
      fullName: "Platform Moderator",
      role: ROLES.MODERATOR,
      bio: "Community moderator reviewing submissions, discussions, and reports.",
      city: "Addis Ababa",
    },
    {
      email: "reviewer@ethiotech.com",
      fullName: "Curriculum Reviewer",
      role: ROLES.REVIEWER,
      bio: "Curriculum and capstone reviewer evaluating project submissions.",
      city: "Addis Ababa",
    },
    {
      email: "support@ethiotech.com",
      fullName: "Support Specialist",
      role: ROLES.SUPPORT,
      bio: "Support specialist assisting learners with credentials and account inquiries.",
      city: "Addis Ababa",
    },
    {
      email: "mentor@ethiotech.com",
      fullName: "Dr. Selamawit Tekle",
      role: ROLES.MENTOR,
      city: "Addis Ababa",
      currentCompany: "Google",
      expertise: ["Distributed Systems", "Cloud Computing", "Go", "TypeScript"],
      mentorStatus: MENTOR_STATUS.APPROVED,
      mentorAccountStatus: MENTOR_ACCOUNT_STATUS.ACTIVE,
      mentorScore: 980,
      totalSessions: 42,
      mentorRating: 4.9,
      feedbackScore: 96,
      attendanceRate: 98,
      termsAcceptedAt: now,
      onboardingCompletedAt: now,
      mustChangePassword: false,
      onboardingSteps: {
        passwordChanged: true,
        termsAccepted: true,
        profileCompleted: true,
        photoUploaded: true,
        availabilitySet: true,
      },
      bio: "Staff Distributed Systems Engineer mentoring African software engineers.",
    },
    {
      email: "parent@ethiotech.com",
      fullName: "Kebede Tadesse",
      role: ROLES.PARENT,
      city: "Addis Ababa",
      linkedStudents: [student._id],
      bio: "Parent monitoring student academic progress and study sessions.",
    },
  ];

  for (const def of roleDefinitions) {
    await User.findOneAndUpdate(
      { email: def.email },
      {
        $set: {
          ...def,
          password: hashedPassword,
          status: USER_STATUS.ACTIVE,
          isVerified: true,
          verifiedAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  log("================================================================");
  log("✅ CANONICAL ROLE ACCOUNTS SEEDED (Password: Passw0rd!)");
  log("================================================================");
  log("1. super_admin : superadmin@ethiotech.com -> /admin");
  log("2. admin       : admin@ethiotech.com      -> /admin");
  log("3. moderator   : moderator@ethiotech.com  -> /admin");
  log("4. reviewer    : reviewer@ethiotech.com   -> /admin");
  log("5. support     : support@ethiotech.com    -> /admin");
  log("6. mentor      : mentor@ethiotech.com     -> /mentor");
  log("7. student     : student@ethiotech.com    -> /app/dashboard");
  log("8. parent      : parent@ethiotech.com     -> /parent");
  log("================================================================");
};

// If run directly from CLI
const isDirectRun =
  process.argv[1] && (process.argv[1].endsWith("seed-roles.js") || process.argv[1].endsWith("seed-roles.ts"));

if (isDirectRun) {
  (async () => {
    try {
      console.log("🔌 Connecting to database...");
      await connectDB();
      console.log("🌱 Seeding canonical role accounts...");
      await seedRoleUsers();
      console.log("✨ Seed completed successfully.");
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    }
  })();
}
