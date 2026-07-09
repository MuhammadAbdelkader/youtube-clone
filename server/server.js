require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// ─── Environment Guard ────────────────────────────────────────────────────────
// Fails loudly at startup if any required variable is absent.
// Logs the MISSING KEY NAME only — never logs the value (secrets stay secret).
const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_ID",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "CLOUDINARY_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("[Startup] FATAL: Missing required environment variables:");
    missing.forEach((key) => console.error(`  ✗  ${key}`));
    console.error("[Startup] Add the missing variables to server/.env and restart.");
    process.exit(1);
  }
  console.info("[Startup] Environment variables validated ✓");
}

async function start() {
  validateEnvironment();

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.info("[MongoDB] Connected");

    app.listen(PORT, () => {
      console.info(`[Server] YouCube API running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
    });
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err.message);
    process.exit(1);
  }
}

// Fail loudly instead of silently continuing on a broken DB connection later
mongoose.connection.on("error", (err) => {
  console.error("[MongoDB] Runtime connection error:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Process] Unhandled rejection:", reason);
});

start();
