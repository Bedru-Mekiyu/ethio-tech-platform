import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { logger } from "../lib/logger.js";

dotenv.config();

export async function connect() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/ethiotech-seed";
  logger.info("[seed] connecting to mongo", { uri });
  await mongoose.connect(uri, {});
}

export async function disconnect() {
  await mongoose.disconnect();
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export async function clearCollections(names = []) {
  for (const name of names) {
    try {
      await mongoose.connection.collection(name).deleteMany({});
      logger.info(`[seed] cleared ${name}`);
    } catch (err) {
      logger.warn(`[seed] could not clear ${name}: ${err.message}`);
    }
  }
}

export function nowMinusDays(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

// ====== EXTENDED UTILITIES ======

export function pick(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickMany(arr, count) {
  return shuffleArray(arr).slice(0, count);
}

export function randomDate(startDate, endDate) {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

export function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateUsername(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z.]/g, "");
}

export function generateEmail(firstName, lastName, domain = "example.com") {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`.replace(/[^a-z@.]/g, "");
}

export function generateAvatarUrl(firstName, lastName) {
  return `/avatars/${firstName.toLowerCase()}_${lastName.toLowerCase()}.png`;
}

export function generatePhoneNumber(countryCode = "+251") {
  return `${countryCode}${randomInt(900000000, 999999999)}`;
}

export function calculateXPForLevel(level) {
  // Exponential XP requirement per level
  return Math.floor(500 * Math.pow(1.5, level - 1));
}

export function calculateLevel(xp) {
  let level = 1;
  let totalXpRequired = 0;
  while (totalXpRequired + calculateXPForLevel(level) <= xp) {
    totalXpRequired += calculateXPForLevel(level);
    level++;
  }
  return Math.min(level, 100); // Cap at level 100
}

export function batchInsert(documents, batchSize = 1000) {
  const batches = [];
  for (let i = 0; i < documents.length; i += batchSize) {
    batches.push(documents.slice(i, i + batchSize));
  }
  return batches;
}

export async function progressBar(current, total, label = "Progress") {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  const bar = `${"=".repeat(filled)}${" ".repeat(empty)}`;
  console.log(`[${bar}] ${percent}% - ${label} (${current}/${total})`);
}
