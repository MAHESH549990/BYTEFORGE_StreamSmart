import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import experimentRoutes from "./routes/experimentRoutes.js";

import videoRoutes from "./routes/videoRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/videos", videoRoutes);
app.use("/api/experiments", experimentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Welcome to StreamSmart Backend!");
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StreamSmart API is running"
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

export default app;