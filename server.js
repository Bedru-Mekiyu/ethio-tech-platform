import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";

// Load env
dotenv.config();

// Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security & basics (Elon: never ship insecure)
app.use(helmet());                    // headers security
app.use(cors({ origin: "*" }));       // change to your domain later
app.use(express.json({ limit: "10mb" })); // safe for code submissions

// Rate limiting (protect from abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,                 // 100 requests per window
  message: "Too many requests from this IP, try again later."
});
app.use("/api/", limiter);

// Health check (useful for Render/Vercel)
app.get("/health", (req, res) => res.status(200).json({ status: "OK", mission: "Building Ethiopia's tech future" }));

// Import routes later (we'll add them step-by-step)
app.use("/api/users", (req, res) => res.send("Users route coming..."));
app.use("/api/xp", (req, res) => res.send("XP engine coming..."));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke — but we fix fast 🇪🇹" });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Ethiopian tech movement starts NOW`);
  });
};

startServer();