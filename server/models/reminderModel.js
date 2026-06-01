const { db } = require("./db");

const allowedCategories = new Set(["class", "exam", "study", "goal", "club"]);
const allowedPriorities = new Set(["low", "medium", "high"]);
const allowedStatuses = new Set(["pending", "completed"]);

const normalizeReminderInput = (payload) => ({
  title: String(payload.title || "").trim(),
  description: String(payload.description || "").trim(),
  category: String(payload.category || "").trim().toLowerCase(),
  reminderDate: String(payload.reminderDate || payload.reminder_date || "").trim(),
  reminderTime: String(payload.reminderTime || payload.reminder_time || "").trim(),
  dayOfWeek: String(payload.dayOfWeek || payload.day_of_week || "").trim(),
  location: String(payload.location || "").trim(),
  priority: String(payload.priority || "medium").trim().toLowerCase(),
  status: String(payload.status || "pending").trim().toLowerCase(),
  isRecurring: payload.isRecurring ? 1 : 0,
  emailEnabled:
    payload.emailEnabled === undefined || payload.emailEnabled === null
      ? 1
      : payload.emailEnabled
        ? 1
        : 0,
});

const validateReminder = (payload) => {
  const reminder = normalizeReminderInput(payload);

  if (!reminder.title) {
    return { error: "Reminder title is required." };
  }

  if (!allowedCategories.has(reminder.category)) {
    return { error: "Reminder category is invalid." };
  }

  if (!reminder.reminderDate) {
    return { error: "Reminder date is required." };
  }

  if (reminder.emailEnabled && !reminder.reminderTime) {
    return { error: "A reminder time is required when email alerts are enabled." };
  }

  if (reminder.category === "class" && !reminder.reminderTime) {
    return { error: "Class routines need a start time." };
  }

  if ((reminder.category === "class" || reminder.category === "club") && !reminder.dayOfWeek) {
    return { error: "Please select the weekday for class routines and club meetings." };
  }

  if (!allowedPriorities.has(reminder.priority)) {
    return { error: "Reminder priority is invalid." };
  }

  if (!allowedStatuses.has(reminder.status)) {
    return { error: "Reminder status is invalid." };
  }

  return { value: reminder };
};

const getReminderById = (id) =>
  db
    .prepare(
      `
        SELECT
          reminders.*,
          users.name AS owner_name,
          users.email AS owner_email
        FROM reminders
        JOIN users ON users.id = reminders.user_id
        WHERE reminders.id = ?
      `
    )
    .get(id);

const createReminder = ({ userId, reminder }) => {
  const result = db
    .prepare(
      `
        INSERT INTO reminders (
          user_id,
          title,
          description,
          category,
          reminder_date,
          reminder_time,
          day_of_week,
          location,
          priority,
          status,
          is_recurring,
          email_enabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      userId,
      reminder.title,
      reminder.description || null,
      reminder.category,
      reminder.reminderDate,
      reminder.reminderTime || null,
      reminder.dayOfWeek || null,
      reminder.location || null,
      reminder.priority,
      reminder.status,
      reminder.isRecurring,
      reminder.emailEnabled
    );

  return getReminderById(result.lastInsertRowid);
};

const updateReminderById = ({ id, userId, reminder, adminOverride = false }) => {
  const existing = getReminderById(id);

  if (!existing) {
    return null;
  }

  if (!adminOverride && Number(existing.user_id) !== Number(userId)) {
    return false;
  }

  db.prepare(
    `
      UPDATE reminders
      SET
        title = ?,
        description = ?,
        category = ?,
        reminder_date = ?,
        reminder_time = ?,
        day_of_week = ?,
        location = ?,
        priority = ?,
        status = ?,
        is_recurring = ?,
        email_enabled = ?,
        notification_last_sent_for = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).run(
    reminder.title,
    reminder.description || null,
    reminder.category,
    reminder.reminderDate,
    reminder.reminderTime || null,
    reminder.dayOfWeek || null,
    reminder.location || null,
    reminder.priority,
    reminder.status,
    reminder.isRecurring,
    reminder.emailEnabled,
    id
  );

  return getReminderById(id);
};

const deleteReminderById = ({ id, userId, adminOverride = false }) => {
  const existing = getReminderById(id);

  if (!existing) {
    return null;
  }

  if (!adminOverride && Number(existing.user_id) !== Number(userId)) {
    return false;
  }

  return db.prepare("DELETE FROM reminders WHERE id = ?").run(id);
};

const buildReminderQuery = ({ userId = null, search = "", category = "", date = "" } = {}) => {
  const clauses = [];
  const params = [];

  if (userId !== null) {
    clauses.push("reminders.user_id = ?");
    params.push(userId);
  }

  if (search) {
    clauses.push("(reminders.title LIKE ? OR reminders.description LIKE ? OR reminders.location LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (category) {
    clauses.push("reminders.category = ?");
    params.push(category);
  }

  if (date) {
    clauses.push("reminders.reminder_date = ?");
    params.push(date);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  return { where, params };
};

const getReminders = ({ userId = null, search = "", category = "", date = "" } = {}) => {
  const { where, params } = buildReminderQuery({ userId, search, category, date });

  return db
    .prepare(
      `
        SELECT
          reminders.*,
          users.name AS owner_name,
          users.email AS owner_email
        FROM reminders
        JOIN users ON users.id = reminders.user_id
        ${where}
        ORDER BY reminders.reminder_date ASC, reminders.reminder_time ASC, reminders.created_at DESC
      `
    )
    .all(...params);
};

const getTimedRemindersForNotification = () =>
  db
    .prepare(
      `
        SELECT
          reminders.*,
          users.name AS owner_name,
          users.email AS owner_email
        FROM reminders
        JOIN users ON users.id = reminders.user_id
        WHERE reminders.status = 'pending'
          AND reminders.email_enabled = 1
          AND reminders.reminder_time IS NOT NULL
          AND TRIM(reminders.reminder_time) <> ''
      `
    )
    .all();

const markReminderNotificationSent = ({ reminderId, occurrenceKey }) =>
  db
    .prepare(
      `
        UPDATE reminders
        SET notification_last_sent_for = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
    .run(occurrenceKey, reminderId);

module.exports = {
  validateReminder,
  createReminder,
  updateReminderById,
  deleteReminderById,
  getReminders,
  getReminderById,
  getTimedRemindersForNotification,
  markReminderNotificationSent,
};
