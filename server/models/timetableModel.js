const { db } = require("./db");

const allowedDays = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

const normalizeTimetableEntry = (payload) => ({
  dayOfWeek: String(payload.dayOfWeek || payload.day_of_week || "").trim(),
  subject: String(payload.subject || "").trim(),
  timeLabel: String(payload.timeLabel || payload.time_label || "").trim(),
  startTime: String(payload.startTime || payload.start_time || "").trim(),
  endTime: String(payload.endTime || payload.end_time || "").trim(),
  location: String(payload.location || "").trim(),
  emailEnabled:
    payload.emailEnabled === undefined || payload.emailEnabled === null
      ? 1
      : payload.emailEnabled
        ? 1
        : 0,
});

const buildTimeLabel = ({ timeLabel, startTime, endTime }) => {
  if (timeLabel) {
    return timeLabel;
  }

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime;
};

const validateTimetableEntry = (payload) => {
  const entry = normalizeTimetableEntry(payload);

  if (!allowedDays.has(entry.dayOfWeek)) {
    return { error: "Please choose a valid day for the timetable entry." };
  }

  if (!entry.subject) {
    return { error: "Subject is required." };
  }

  entry.timeLabel = buildTimeLabel(entry);

  if (!entry.timeLabel || !entry.startTime) {
    return { error: "Time is required." };
  }

  return { value: entry };
};

const getTimetableEntryById = (id) =>
  db
    .prepare(
      `
        SELECT *
        FROM timetable_entries
        WHERE id = ?
      `
    )
    .get(id);

const getTimetableEntriesByUserId = (userId) =>
  db
    .prepare(
      `
        SELECT *
        FROM timetable_entries
        WHERE user_id = ?
        ORDER BY
          CASE day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
            ELSE 8
          END,
          COALESCE(start_time, time_label) ASC,
          created_at DESC
      `
    )
    .all(userId);

const createTimetableEntry = ({ userId, entry }) => {
  const result = db
    .prepare(
      `
        INSERT INTO timetable_entries (
          user_id,
          day_of_week,
          subject,
          time_label,
          start_time,
          end_time,
          location,
          email_enabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      userId,
      entry.dayOfWeek,
      entry.subject,
      entry.timeLabel,
      entry.startTime || null,
      entry.endTime || null,
      entry.location || null,
      entry.emailEnabled
    );

  return getTimetableEntryById(result.lastInsertRowid);
};

const updateTimetableEntryById = ({ id, userId, entry }) => {
  const existing = getTimetableEntryById(id);

  if (!existing) {
    return null;
  }

  if (Number(existing.user_id) !== Number(userId)) {
    return false;
  }

  db.prepare(
    `
      UPDATE timetable_entries
      SET
        day_of_week = ?,
        subject = ?,
        time_label = ?,
        start_time = ?,
        end_time = ?,
        location = ?,
        email_enabled = ?,
        notification_last_sent_for = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).run(
    entry.dayOfWeek,
    entry.subject,
    entry.timeLabel,
    entry.startTime || null,
    entry.endTime || null,
    entry.location || null,
    entry.emailEnabled,
    id
  );

  return getTimetableEntryById(id);
};

const deleteTimetableEntryById = ({ id, userId }) => {
  const existing = getTimetableEntryById(id);

  if (!existing) {
    return null;
  }

  if (Number(existing.user_id) !== Number(userId)) {
    return false;
  }

  return db.prepare("DELETE FROM timetable_entries WHERE id = ?").run(id);
};

const getTimetableEntriesForNotification = () =>
  db
    .prepare(
      `
        SELECT
          timetable_entries.*,
          users.name AS owner_name,
          users.email AS owner_email
        FROM timetable_entries
        JOIN users ON users.id = timetable_entries.user_id
        WHERE timetable_entries.email_enabled = 1
      `
    )
    .all();

const markTimetableNotificationSent = ({ entryId, occurrenceKey }) =>
  db
    .prepare(
      `
        UPDATE timetable_entries
        SET notification_last_sent_for = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
    .run(occurrenceKey, entryId);

module.exports = {
  validateTimetableEntry,
  getTimetableEntriesByUserId,
  createTimetableEntry,
  updateTimetableEntryById,
  deleteTimetableEntryById,
  getTimetableEntriesForNotification,
  markTimetableNotificationSent,
};
