import mongoose from "mongoose";
import { getEnv } from "./env.js";

let memoryServer = null;

const startMemoryServer = async () => {
  if (memoryServer) return memoryServer;

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: "ethiotech" },
  });

  return memoryServer;
};

const connectWithUri = async (uri) => {
  await mongoose.connect(uri);
};

export const connectDB = async () => {
  const { isProduction } = getEnv();
  const explicitMongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
  const uri = explicitMongoUri;

  if (uri) {
    try {
      await connectWithUri(uri);
      console.log("✅ MongoDB connected");
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isProduction) {
        console.error("❌ DB connection failed:", message);
        process.exit(1);
      }
      console.warn(`⚠️  MongoDB URI connection failed (${message}). Falling back to in-memory database.`);
    }
  } else if (isProduction) {
    console.error("❌ DB connection failed: MONGO_URI is required in production");
    process.exit(1);
  }

  try {
    const server = await startMemoryServer();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(server.getUri());
    console.log("✅ MongoDB connected (in-memory)");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ DB connection failed:", message);
    process.exit(1);
  }
};

export const stopDB = async () => {
  await mongoose.disconnect();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};
