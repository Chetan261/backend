// index.js — Vercel-safe, explicit handler
require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");

// route imports (unchanged)
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const ALLOWED_ORIGIN = "https://expense-tracker-six-alpha-86.vercel.app";

const app = express();

try {
  // connect to DB (wrap to surface errors)
  connectDB();
} catch (err) {
  console.error("DB connect error:", err && err.message);
}

// Body parser
app.use(express.json());

// --- GLOBAL CORS + SIMPLE LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  // Very explicit CORS headers
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin"); // good practice when using multiple origins later
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  // quick request log for debugging (safe to remove later)
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} Origin:${req.headers.origin}`);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Basic error handler to avoid crashing without headers
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  // ensure CORS header even on error
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.status(err?.status || 500).json({ message: "Server error", error: err?.message || String(err) });
});

// Export handler function for Vercel
module.exports = (req, res) => {
  // Express expects Node req/res; call app
  try {
    return app(req, res);
  } catch (err) {
    // Very defensive: if app throws synchronously, return minimal response with CORS header
    console.error("Synchronous handler error:", err);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.status(500).end("Internal server error");
  }
};
