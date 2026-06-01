const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const databaseDir = path.join(__dirname, "../../database");
const databasePath = path.join(databaseDir, "db.sqlite");

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

const ensureColumn = (tableName, columnName, definition) => {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
};

const backfillTimetableTimes = () => {
  const rows = db
    .prepare(
      `
        SELECT id, time_label, start_time, end_time
        FROM timetable_entries
        WHERE (start_time IS NULL OR TRIM(start_time) = '')
          AND time_label IS NOT NULL
          AND TRIM(time_label) <> ''
      `
    )
    .all();

  const updateRow = db.prepare(
    `
      UPDATE timetable_entries
      SET start_time = ?,
          end_time = CASE
            WHEN (end_time IS NULL OR TRIM(end_time) = '') THEN ?
            ELSE end_time
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  );

  for (const row of rows) {
    const match = String(row.time_label).match(/^(\d{2}:\d{2})(?:\s*-\s*(\d{2}:\d{2}))?/);
    if (!match) {
      continue;
    }

    const startTime = match[1] || null;
    const endTime = match[2] || null;

    if (startTime) {
      updateRow.run(startTime, endTime, row.id);
    }
  }
};

const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      department TEXT,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK(category IN ('class', 'exam', 'study', 'goal', 'club')),
      reminder_date TEXT NOT NULL,
      reminder_time TEXT,
      day_of_week TEXT,
      location TEXT,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      is_recurring INTEGER NOT NULL DEFAULT 0,
      email_enabled INTEGER NOT NULL DEFAULT 1,
      notification_last_sent_for TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      deadline_date TEXT,
      deadline_time TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
      email_enabled INTEGER NOT NULL DEFAULT 1,
      notification_last_sent_for TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goal_daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      summary_date TEXT NOT NULL,
      total_goals INTEGER NOT NULL DEFAULT 0,
      completed_goals INTEGER NOT NULL DEFAULT 0,
      pending_goals INTEGER NOT NULL DEFAULT 0,
      all_goals_json TEXT,
      completed_goals_json TEXT,
      pending_goals_json TEXT,
      notification_message TEXT,
      completion_rate REAL NOT NULL DEFAULT 0,
      delivery_status TEXT NOT NULL DEFAULT 'simulated',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, summary_date),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      day_of_week TEXT,
      subject TEXT NOT NULL,
      time_label TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      location TEXT,
      email_enabled INTEGER NOT NULL DEFAULT 1,
      notification_last_sent_for TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
    CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_goal_daily_summaries_user_date ON goal_daily_summaries(user_id, summary_date);
    CREATE INDEX IF NOT EXISTS idx_timetable_entries_user_id ON timetable_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_timetable_entries_day_of_week ON timetable_entries(day_of_week);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_sender ON messages(recipient_id, sender_id, created_at);
  `);

  ensureColumn("reminders", "email_enabled", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("reminders", "notification_last_sent_for", "TEXT");
  ensureColumn("goal_daily_summaries", "all_goals_json", "TEXT");
  ensureColumn("goal_daily_summaries", "completed_goals_json", "TEXT");
  ensureColumn("goal_daily_summaries", "pending_goals_json", "TEXT");
  ensureColumn("goal_daily_summaries", "notification_message", "TEXT");
  ensureColumn("goal_daily_summaries", "completion_rate", "REAL NOT NULL DEFAULT 0");
  ensureColumn("goal_daily_summaries", "delivery_status", "TEXT NOT NULL DEFAULT 'simulated'");
  ensureColumn("goals", "deadline_time", "TEXT");
  ensureColumn("goals", "email_enabled", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("goals", "notification_last_sent_for", "TEXT");
  ensureColumn("timetable_entries", "start_time", "TEXT");
  ensureColumn("timetable_entries", "end_time", "TEXT");
  ensureColumn("timetable_entries", "email_enabled", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("timetable_entries", "notification_last_sent_for", "TEXT");
  backfillTimetableTimes();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@college.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .get(adminEmail);

  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(
      `
        INSERT INTO users (name, email, password_hash, department, role)
        VALUES (?, ?, ?, ?, ?)
      `
    ).run("System Admin", adminEmail, passwordHash, "Administration", "admin");
  }
};

module.exports = {
  db,
  initializeDatabase,
};
