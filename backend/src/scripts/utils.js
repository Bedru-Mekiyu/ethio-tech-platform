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
