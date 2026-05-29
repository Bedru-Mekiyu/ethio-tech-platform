import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import { createAdmin } from "./factories.js";

dotenv.config();

const testSeed = async () => {
  try {
    console.log("Testing basic seed...");
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Clear users
    await mongoose.connection.collection("users").deleteMany({});
    console.log("✅ Cleared users");

    // Create admin
    console.log("Creating admin...");
    const admin = createAdmin({ firstName: "Test", lastName: "Admin", email: "test@test.com" });
    console.log("Admin object created:", admin);
    
    const createdAdmin = await User.insertMany([admin]);
    console.log("✅ Created admin:", createdAdmin[0].email);

    console.log("\n✅ TEST SEED SUCCESSFUL!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ TEST SEED FAILED:");
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

testSeed();
