import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import experimentRoutes from "./routes/experimentRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import edgeRoutes from "./routes/edgeRoutes.js";

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

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Existing routes
app.use("/api/videos", videoRoutes);
app.use("/api/experiments", experimentRoutes);

// NEW: Edge Server routes
app.use("/api/edge", edgeRoutes);

// Redirect backend root to frontend landing page
app.get("/", (req, res) => {
  const frontendUrl = process.env.CLIENT_URL;

  if (!frontendUrl) {
    return res.status(200).json({
      message: "StreamSmart Backend is running"
    });
  }

  res.redirect(302, frontendUrl);
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