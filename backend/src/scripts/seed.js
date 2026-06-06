import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import DailyChallenge from "../models/DailyChallenge.js";
import XPLog from "../models/XPLog.js";
import UserStreak from "../models/UserStreak.js";
import Session from "../models/Session.js";
import Submission from "../models/Submission.js";
import PeerGroup from "../models/PeerGroup.js";
import Hub from "../models/Hub.js";
import MentorAvailability from "../models/MentorAvailability.js";
import ChatMessage from "../models/ChatMessage.js";
import Certificate from "../models/Certificate.js";
import DailyChallengeCompletion from "../models/DailyChallengeCompletion.js";

import {
  createStudent,
  createMentor,
  createAdmin,
  createUserStreak,
  createSession,
  createSubmission,
  createPeerGroup,
  createChatMessage,
  createCertificate,
  createHub,
  createMentorAvailability,
  createXPLog,
} from "./factories.js";
import { createTracksAndContent, createBadgesAndLevels, createDailyChallengesForMonth } from "./generators.js";
import { randomInt, pick, pickMany, batchInsert, hoursAgo } from "./utils.js";
import { ETHIOPIAN_CITIES } from "./datasets.js";

dotenv.config();

export const runSeed = async ({ verbose = true } = {}) => {
  const log = (...args) => {
    if (verbose) console.log(...args);
  };

  log("🌍 Starting comprehensive seed for Ethio Tech Platform...");

  // ====== CLEAR COLLECTIONS ======
  if (verbose) console.log("🗑️  Clearing existing data...");
  const collections = [
    "users",
    "tracks",
    "modules",
    "lessons",
    "projects",
    "badges",
    "levelconfigs",
    "dailychallenges",
    "xplogs",
    "userstreaks",
    "sessions",
    "submissions",
    "peergroups",
    "hubs",
    "mentoravailabilities",
    "chatmessages",
    "certificates",
    "dailychallengecompletions",
  ];

  for (const collection of collections) {
    try {
      await mongoose.connection.collection(collection).deleteMany({});
    } catch {
      // Silently ignore errors
    }
  }
  log("✅ Data cleared");

  // ====== CREATE EDUCATIONAL CONTENT ======
  log("📚 Creating educational tracks and content...");
  const tracks = await createTracksAndContent();
  log(`✅ Created ${tracks.length} tracks`);

  // ====== CREATE BADGES & LEVELS ======
  log("🏅 Creating badges and levels...");
  const { badges, levels } = await createBadgesAndLevels();
  log(`✅ Created ${badges.length} badges and ${levels.length} levels`);

  // ====== CREATE DAILY CHALLENGES ======
  log("⚡ Creating daily challenges...");
  const challenges = await createDailyChallengesForMonth();
  log(`✅ Created ${challenges.length} daily challenges`);

  // ====== CREATE ADMIN ======
  log("👨‍💼 Creating admin...");
  const admins = [createAdmin({ firstName: "Admin", lastName: "User", email: "admin@ethiotech.com" })];
  const createdAdmins = await User.insertMany(admins);
  log(`✅ Created admin`);

  // ====== CREATE MENTORS ======
  log("🎓 Creating mentors...");
  const mentorCount = 12;
  const mentors = [];
  for (let i = 0; i < mentorCount; i++) {
    mentors.push(createMentor());
  }
  const createdMentors = await User.insertMany(mentors);
  log(`✅ Created ${createdMentors.length} mentors`);

  // ====== CREATE HUBS ======
  log("🏢 Creating hubs...");
  const hubs = [];
  for (let i = 0; i < Math.min(ETHIOPIAN_CITIES.length, 8); i++) {
    const city = ETHIOPIAN_CITIES[i];
    const mentorInCharge = i < createdMentors.length ? createdMentors[i]._id : createdMentors[0]._id;
    hubs.push(createHub(city, mentorInCharge));
  }
  const createdHubs = await Hub.insertMany(hubs);
  log(`✅ Created ${createdHubs.length} hubs`);

  // ====== CREATE MENTOR AVAILABILITY ======
  log("📅 Creating mentor availability...");
  const availabilities = [];
  for (const mentor of createdMentors) {
    const slots = createMentorAvailability(mentor._id);
    availabilities.push(...slots);
  }
  if (availabilities.length > 0) {
    const availBatches = batchInsert(availabilities, 500);
    for (const batch of availBatches) {
      await MentorAvailability.insertMany(batch).catch(() => {});
    }
  }
  log(`✅ Created ${availabilities.length} availability slots`);

  // ====== CREATE STUDENTS ======
  log("👨‍🎓 Creating students...");
  const studentCount = 45;
  const students = [];
  for (let i = 0; i < studentCount; i++) {
    students.push(createStudent({ isActive: Math.random() > 0.15 }));
  }
  const studentBatches = batchInsert(students, 500);
  let createdStudents = [];
  for (const batch of studentBatches) {
    createdStudents = createdStudents.concat(await User.insertMany(batch));
  }
  log(`✅ Created ${createdStudents.length} students`);

  // ====== ENROLL STUDENTS ======
  log("📖 Enrolling students...");
  for (const student of createdStudents) {
    const enrolledTracks = pickMany(tracks, randomInt(1, 3));
    student.enrolledTracks = enrolledTracks.map((t) => t._id);
    await student.save();
  }
  log(`✅ Enrolled students`);

  // ====== CREATE STREAKS ======
  log("🔥 Creating streaks...");
  const streaks = createdStudents.map((s) => createUserStreak(s._id, randomInt(0, 90), randomInt(0, 200)));
  const streakBatches = batchInsert(streaks, 500);
  for (const batch of streakBatches) {
    await UserStreak.insertMany(batch);
  }
  log(`✅ Created streaks`);

  // ====== CREATE XP LOGS ======
  log("⭐ Creating XP logs...");
  const xpLogs = [];
  for (const student of createdStudents) {
    for (let i = 0; i < randomInt(3, 15); i++) {
      xpLogs.push(createXPLog(student._id, randomInt(25, 200), "lesson_completed", "lesson", pick(tracks)._id));
    }
  }
  const xpBatches = batchInsert(xpLogs, 1000);
  for (const batch of xpBatches) {
    await XPLog.insertMany(batch).catch(() => {});
  }
  log(`✅ Created ${xpLogs.length} XP logs`);

  // ====== CREATE SUBMISSIONS ======
  log("📝 Creating submissions...");
  const submissions = [];
  const allProjects = await Project.find();
  for (let i = 0; i < Math.min(createdStudents.length, 30); i++) {
    const student = createdStudents[i];
    for (let j = 0; j < randomInt(1, 3); j++) {
      if (allProjects.length > 0) {
        const project = pick(allProjects);
        const status = pick(["pending", "reviewed", "approved", "rejected"]);
        submissions.push(
          createSubmission({
            studentId: student._id,
            projectId: project._id,
            status,
            reviewedBy: status !== "pending" ? pick(createdMentors)._id : null,
          }),
        );
      }
    }
  }
  const submissionBatches = batchInsert(submissions, 500);
  for (const batch of submissionBatches) {
    await Submission.insertMany(batch).catch(() => {});
  }
  log(`✅ Created ${submissions.length} submissions`);

  // ====== CREATE PEER GROUPS ======
  log("👥 Creating peer groups...");
  const peerGroups = [];
  for (const track of tracks) {
    for (let i = 0; i < randomInt(2, 3); i++) {
      const memberCount = randomInt(3, 10);
      const members = pickMany(createdStudents, Math.min(memberCount, createdStudents.length));
      if (members.length > 0) {
        peerGroups.push(
          createPeerGroup(
            track._id,
            pick(members)._id,
            members.map((m) => m._id),
          ),
        );
      }
    }
  }
  await PeerGroup.insertMany(peerGroups);
  log(`✅ Created ${peerGroups.length} peer groups`);

  // ====== CREATE SESSIONS ======
  log("🎓 Creating sessions...");
  const sessions = [];
  for (const mentor of createdMentors) {
    for (let i = 0; i < randomInt(2, 4); i++) {
      const hoursAhead = randomInt(-48, 168);
      let status = "scheduled";
      if (hoursAhead < -2) status = "ended";
      if (hoursAhead < 0 && hoursAhead > -2) status = "live";

      const session = createSession({
        mentorId: mentor._id,
        scheduledAt: hoursAgo(-hoursAhead),
        status,
      });

      if (createdStudents.length > 0) {
        session.participants = pickMany(createdStudents, randomInt(3, Math.min(12, createdStudents.length))).map(
          (p) => p._id,
        );
      }

      sessions.push(session);
    }
  }
  await Session.insertMany(sessions);
  log(`✅ Created ${sessions.length} sessions`);

  // ====== CREATE COMPLETIONS ======
  log("⚡ Creating challenge completions...");
  const completions = [];
  const allChallenges = await DailyChallenge.find();
  for (const student of createdStudents) {
    for (let i = 0; i < randomInt(3, 12); i++) {
      if (allChallenges.length > 0) {
        completions.push({
          user: student._id,
          challenge: pick(allChallenges)._id,
          completedAt: new Date(),
        });
      }
    }
  }
  const completionBatches = batchInsert(completions, 1000);
  for (const batch of completionBatches) {
    await DailyChallengeCompletion.insertMany(batch).catch(() => {});
  }
  log(`✅ Created ${completions.length} completions`);

  // ====== CREATE CERTIFICATES ======
  log("🎖️  Creating certificates...");
  const certificates = [];
  for (let i = 0; i < Math.min(createdStudents.length, 25); i++) {
    const student = createdStudents[i];
    for (const track of pickMany(tracks, randomInt(1, 2))) {
      certificates.push(createCertificate(student._id, track._id));
    }
  }
  if (certificates.length > 0) {
    await Certificate.insertMany(certificates).catch(() => {});
  }
  log(`✅ Created ${certificates.length} certificates`);

  // ====== CREATE CHAT MESSAGES ======
  log("💬 Creating chat messages...");
  const chatMessages = [];
  const rooms = tracks.slice(0, Math.min(3, tracks.length)).map((t) => `track-${t._id}`);
  for (const room of rooms) {
    for (let i = 0; i < randomInt(12, 35); i++) {
      if (createdStudents.length > 0) {
        chatMessages.push(createChatMessage(room, pick(createdStudents)._id));
      }
    }
  }
  const messageBatches = batchInsert(chatMessages, 500);
  for (const batch of messageBatches) {
    await ChatMessage.insertMany(batch).catch(() => {});
  }
  log(`✅ Created ${chatMessages.length} messages`);

  if (verbose) {
    console.log("\n" + "=".repeat(70));
    console.log("✅ SEED COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70) + "\n");

    console.log("📊 DATA SUMMARY:");
    console.log(`  Admins: ${createdAdmins.length}`);
    console.log(`  Mentors: ${createdMentors.length}`);
    console.log(`  Students: ${createdStudents.length}`);
    console.log(`  Tracks: ${tracks.length}`);
    console.log(`  Peer Groups: ${peerGroups.length}`);
    console.log(`  Sessions: ${sessions.length}`);
    console.log(`  Project Submissions: ${submissions.length}`);
    console.log(`  Certificates: ${certificates.length}\n`);

    console.log("🎓 TEST ACCOUNTS:");
    console.log(`  📧 Admin: admin@ethiotech.com / Passw0rd!`);
    if (createdMentors.length > 0) console.log(`  👨‍🏫 Mentor: ${createdMentors[0].email} / Passw0rd!`);
    if (createdStudents.length > 0) console.log(`  👨‍🎓 Student: ${createdStudents[0].email} / Passw0rd!\n`);

    console.log("🚀 Ethio Tech Platform ecosystem is ready for use!\n");
  }

  return {
    admins: createdAdmins.length,
    mentors: createdMentors.length,
    students: createdStudents.length,
    tracks: tracks.length,
  };
};

const main = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB\n");
    await runSeed({ verbose: true });
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ SEED FAILED:", error.message);
    console.error(error.stack);
    try {
      await mongoose.connection.close();
    } catch {
      // Ignore
    }
    process.exit(1);
  }
};

const invokedDirectly = import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`;
if (invokedDirectly) {
  main();
}
