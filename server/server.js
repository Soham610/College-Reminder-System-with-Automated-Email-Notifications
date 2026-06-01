const path = require("path");
const express = require("express");
const cors = require("cors");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const { initializeDatabase } = require("./models/db");
const authRoutes = require("./routes/authRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const goalRoutes = require("./routes/goalRoutes");
const systemRoutes = require("./routes/systemRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const adminRoutes = require("./routes/adminRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { startGoalSummaryWorker } = require("./services/goalSummaryService");
const { startReminderNotificationWorker } = require("./services/reminderNotificationService");

const app = express();
const port = process.env.PORT || 5001;
const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

initializeDatabase();
startReminderNotificationWorker();
startGoalSummaryWorker();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = configuredOrigins.includes(origin);
      const isLocalViteOrigin = /^http:\/\/localhost:517\d$/.test(origin);

      if (isConfiguredOrigin || isLocalViteOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api", adminRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/messages", messageRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: error.message || "An unexpected server error occurred.",
  });
});

app.listen(port, () => {
  console.log(`College Reminder System API running on http://localhost:${port}`);
});
