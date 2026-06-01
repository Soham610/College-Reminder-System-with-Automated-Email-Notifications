const {
  getTimedRemindersForNotification,
  markReminderNotificationSent,
} = require("../models/reminderModel");
const {
  getTimedGoalsForNotification,
  markGoalNotificationSent,
} = require("../models/goalModel");
const {
  getTimetableEntriesForNotification,
  markTimetableNotificationSent,
} = require("../models/timetableModel");
const { getEmailDiagnostics, sendReminderEmail } = require("./emailService");
const {
  addDays,
  buildLocalDateTime,
  getLocalDate,
  getLocalWeekday,
} = require("../utils/date");

const CHECK_INTERVAL_MS = 60 * 1000;
const NOTIFICATION_WINDOW_MS = 5 * 60 * 1000;
const orderedDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

let timer = null;
let running = false;

const formatOccurrenceDateTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

const getOccurrenceForReminder = (reminder, now) => {
  if (!reminder.reminder_date || !reminder.reminder_time) {
    return null;
  }

  let occurrenceDate = reminder.reminder_date;
  let occurrence = buildLocalDateTime(occurrenceDate, reminder.reminder_time);
  if (!occurrence) {
    return null;
  }

  if (!reminder.is_recurring) {
    return occurrence;
  }

  while (occurrence.getTime() + NOTIFICATION_WINDOW_MS < now.getTime()) {
    occurrenceDate = addDays(occurrenceDate, 7);
    occurrence = buildLocalDateTime(occurrenceDate, reminder.reminder_time);
    if (!occurrence) {
      return null;
    }
  }

  return occurrence;
};

const getNextOccurrenceForWeeklyDay = ({ dayOfWeek, timeString, now }) => {
  if (!dayOfWeek || !timeString) {
    return null;
  }

  const today = getLocalDate(now);
  const todayIndex = orderedDays.indexOf(getLocalWeekday(now));
  const targetIndex = orderedDays.indexOf(dayOfWeek);

  if (todayIndex < 0 || targetIndex < 0) {
    return null;
  }

  let daysAhead = targetIndex - todayIndex;
  if (daysAhead < 0) {
    daysAhead += 7;
  }

  let occurrenceDate = addDays(today, daysAhead);
  let occurrence = buildLocalDateTime(occurrenceDate, timeString);

  if (occurrence && occurrence.getTime() + NOTIFICATION_WINDOW_MS < now.getTime()) {
    occurrenceDate = addDays(occurrenceDate, 7);
    occurrence = buildLocalDateTime(occurrenceDate, timeString);
  }

  return occurrence;
};

const buildReminderEmail = ({ title, categoryLabel, description, location, occurrence }) => {
  const formattedTime = formatOccurrenceDateTime(occurrence);

  return {
    subject: `${categoryLabel}: ${title} starts in 5 minutes`,
    text: `${title} starts at ${formattedTime}. Location: ${
      location || "Not specified"
    }. ${description || "Open the College Reminder System for full details."}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #2F3E46; line-height: 1.6;">
        <h2 style="color: #354F52;">${categoryLabel}</h2>
        <p>Your item <strong>${title}</strong> starts in approximately 5 minutes.</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Location:</strong> ${location || "Not specified"}</p>
        <p><strong>Details:</strong> ${description || "No additional details."}</p>
      </div>
    `,
  };
};

const processUpcomingItem = async ({
  itemId,
  occurrence,
  occurrenceKey,
  alreadySentFor,
  to,
  title,
  categoryLabel,
  description,
  location,
  markSent,
  now,
}) => {
  if (!occurrence) {
    return { attempted: false, sent: false, status: "invalid" };
  }

  const timeUntilStart = occurrence.getTime() - now.getTime();
  if (timeUntilStart < 0 || timeUntilStart > NOTIFICATION_WINDOW_MS) {
    return { attempted: false, sent: false, status: "outside_window" };
  }

  if (alreadySentFor === occurrenceKey) {
    return { attempted: false, sent: false, status: "already_sent" };
  }

  const email = buildReminderEmail({
    title,
    categoryLabel,
    description,
    location,
    occurrence,
  });

  const result = await sendReminderEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (result.sent) {
    markSent({ itemId, occurrenceKey });
    return { attempted: true, sent: true, status: "sent" };
  }

  return {
    attempted: true,
    sent: false,
    status: "failed",
    reason: result.reason || "",
  };
};

const parseStartTimeFromLabel = (value) => {
  const match = String(value || "").match(/^(\d{2}:\d{2})/);
  return match ? match[1] : "";
};

const processReminderNotifications = async () => {
  const diagnostics = getEmailDiagnostics();
  if (!diagnostics.ready || running) {
    return;
  }

  running = true;

  try {
    const now = new Date();
    const reminders = getTimedRemindersForNotification();
    const timetableEntries = getTimetableEntriesForNotification();
    const goals = getTimedGoalsForNotification();

    for (const reminder of reminders) {
      const occurrence = getOccurrenceForReminder(reminder, now);

      await processUpcomingItem({
        itemId: reminder.id,
        occurrence,
        occurrenceKey: occurrence ? occurrence.toISOString() : "",
        alreadySentFor: reminder.notification_last_sent_for,
        to: reminder.owner_email,
        title: reminder.title,
        categoryLabel: reminder.category === "class" ? "Class Reminder" : "Reminder Alert",
        description: reminder.description,
        location: reminder.location,
        markSent: ({ itemId, occurrenceKey }) =>
          markReminderNotificationSent({ reminderId: itemId, occurrenceKey }),
        now,
      });
    }

    for (const entry of timetableEntries) {
      const occurrence = getNextOccurrenceForWeeklyDay({
        dayOfWeek: entry.day_of_week,
        timeString: entry.start_time || parseStartTimeFromLabel(entry.time_label),
        now,
      });

      await processUpcomingItem({
        itemId: entry.id,
        occurrence,
        occurrenceKey: occurrence ? occurrence.toISOString() : "",
        alreadySentFor: entry.notification_last_sent_for,
        to: entry.owner_email,
        title: entry.subject,
        categoryLabel: "Class Reminder",
        description: `Scheduled class for ${entry.day_of_week}.`,
        location: entry.location,
        markSent: ({ itemId, occurrenceKey }) =>
          markTimetableNotificationSent({ entryId: itemId, occurrenceKey }),
        now,
      });
    }

    for (const goal of goals) {
      const occurrence = buildLocalDateTime(goal.deadline_date, goal.deadline_time);

      await processUpcomingItem({
        itemId: goal.id,
        occurrence,
        occurrenceKey: occurrence ? occurrence.toISOString() : "",
        alreadySentFor: goal.notification_last_sent_for,
        to: goal.owner_email,
        title: goal.title,
        categoryLabel: "Goal Reminder",
        description: "This goal is due shortly. Please review your goals section.",
        location: "",
        markSent: ({ itemId, occurrenceKey }) =>
          markGoalNotificationSent({ goalId: itemId, occurrenceKey }),
        now,
      });
    }
  } catch (error) {
    console.error("Reminder notification worker failed:", error.message);
  } finally {
    running = false;
  }
};

const startReminderNotificationWorker = () => {
  if (timer) {
    return;
  }

  timer = setInterval(() => {
    processReminderNotifications();
  }, CHECK_INTERVAL_MS);

  processReminderNotifications();
};

const attemptImmediateReminderNotification = async (reminder) => {
  const diagnostics = getEmailDiagnostics();
  if (!diagnostics.ready) {
    return {
      attempted: false,
      sent: false,
      status: "mailer_unavailable",
      reason: diagnostics.message,
    };
  }

  const now = new Date();
  const occurrence = getOccurrenceForReminder(reminder, now);

  return processUpcomingItem({
    itemId: reminder.id,
    occurrence,
    occurrenceKey: occurrence ? occurrence.toISOString() : "",
    alreadySentFor: reminder.notification_last_sent_for,
    to: reminder.owner_email,
    title: reminder.title,
    categoryLabel: reminder.category === "class" ? "Class Reminder" : "Reminder Alert",
    description: reminder.description,
    location: reminder.location,
    markSent: ({ itemId, occurrenceKey }) =>
      markReminderNotificationSent({ reminderId: itemId, occurrenceKey }),
    now,
  });
};

const attemptImmediateGoalNotification = async ({ goal, ownerEmail }) => {
  const diagnostics = getEmailDiagnostics();
  if (!diagnostics.ready) {
    return {
      attempted: false,
      sent: false,
      status: "mailer_unavailable",
      reason: diagnostics.message,
    };
  }

  const now = new Date();
  const occurrence = buildLocalDateTime(goal.deadline_date, goal.deadline_time);

  return processUpcomingItem({
    itemId: goal.id,
    occurrence,
    occurrenceKey: occurrence ? occurrence.toISOString() : "",
    alreadySentFor: goal.notification_last_sent_for,
    to: ownerEmail,
    title: goal.title,
    categoryLabel: "Goal Reminder",
    description: "This goal is due shortly. Please review your goals section.",
    location: "",
    markSent: ({ itemId, occurrenceKey }) =>
      markGoalNotificationSent({ goalId: itemId, occurrenceKey }),
    now,
  });
};

module.exports = {
  startReminderNotificationWorker,
  getEmailDiagnostics,
  attemptImmediateReminderNotification,
  attemptImmediateGoalNotification,
};
