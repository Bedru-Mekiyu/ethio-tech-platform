import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import LevelConfig from "../models/LevelConfig.js";
import Badge from "../models/Badge.js";
import Track from "../models/Track.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Project from "../models/Project.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  await LevelConfig.deleteMany({});
  await Badge.deleteMany({});
  await Track.deleteMany({});
  await Module.deleteMany({});
  await Lesson.deleteMany({});
  await Project.deleteMany({});

  const levels = [
    { level: 1, title: "Starter", xpRequired: 0, perks: ["Access beginner lessons"] },
    { level: 2, title: "Builder", xpRequired: 200, perks: ["Join peer groups"] },
    { level: 3, title: "Innovator", xpRequired: 600, perks: ["Advanced projects unlocked"] },
    { level: 4, title: "Leader", xpRequired: 1200, perks: ["Community leadership opportunities"] },
  ];

  const badges = [
    { name: "First Steps", description: "Complete your first lesson", xpBonus: 20, category: "achievement" },
    { name: "Helper", description: "Support peers consistently", xpBonus: 40, category: "community" },
    { name: "Project Finisher", description: "Get first project approved", xpBonus: 60, category: "skill" },
  ];

  await LevelConfig.insertMany(levels);
  await Badge.insertMany(badges);

  const track = await Track.create({
    title: "Software Engineering Foundations",
    description: "From coding basics to real-world projects.",
    category: "beginner",
    xpReward: 500,
    estimatedWeeks: 8,
  });

  const moduleDoc = await Module.create({
    title: "JavaScript Basics",
    description: "Variables, control flow, functions.",
    track: track._id,
    order: 1,
  });

  const lesson = await Lesson.create({
    title: "Variables and Data Types",
    content: "Learn JS variables, strings, numbers, booleans.",
    module: moduleDoc._id,
    xpReward: 40,
    durationMinutes: 30,
    order: 1,
  });

  const project = await Project.create({
    title: "Build a Student Progress Tracker",
    description: "Create a mini app to track lessons and XP.",
    track: track._id,
    difficulty: "easy",
    xpReward: 250,
    requirements: ["Track lesson completion", "Display total XP"],
  });

  moduleDoc.lessons = [lesson._id];
  await moduleDoc.save();

  track.modules = [moduleDoc._id];
  await track.save();

  console.log("✅ Seed completed");
  console.log("Track:", track.title);
  console.log("Module:", moduleDoc.title);
  console.log("Lesson:", lesson.title);
  console.log("Project:", project.title);

  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error("❌ Seed failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
