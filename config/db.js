import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URL;

    if (!mongoUri) {
      throw new Error("Missing Mongo URI. Set MONGO_URI or MONGODB_URL in .env");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Atlas connected (Free M0 tier ready for Ethiopia launch)");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};