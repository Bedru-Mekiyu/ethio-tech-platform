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

export const connectDB = async () => {
  try {
    const { mongoUri, isProduction } = getEnv();
    const explicitMongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;
    const uri = mongoUri || explicitMongoUri;

    if (uri) {
      await mongoose.connect(uri);
      console.log("✅ MongoDB connected");
      return;
    }

    if (isProduction) {
      throw new Error("MONGO_URI is required in production");
    }

    const server = await startMemoryServer();
    await mongoose.connect(server.getUri());
    console.log("✅ MongoDB connected");
  } catch (err) {
    if (!process.env.MONGO_URI && !process.env.MONGODB_URL) {
      try {
        const server = await startMemoryServer();
        await mongoose.disconnect();
        await mongoose.connect(server.getUri());
        console.log("✅ MongoDB connected");
        return;
      } catch (memoryErr) {
        console.error(
          "❌ DB connection failed:",
          memoryErr instanceof Error ? memoryErr.message : String(memoryErr)
        );
        process.exit(1);
      }
    }

    console.error(
      "❌ DB connection failed:",
      err instanceof Error ? err.message : String(err)
    );
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