const {
  validateReminder,
  createReminder,
  updateReminderById,
  deleteReminderById,
  getReminders,
} = require("../models/reminderModel");
const {
  attemptImmediateReminderNotification,
} = require("../services/reminderNotificationService");

const listStudentReminders = (req, res) => {
  const reminders = getReminders({
    userId: req.user.id,
    search: req.query.search || "",
    category: req.query.category || "",
    date: req.query.date || "",
  });

  return res.json(reminders);
};

const addReminder = async (req, res, next) => {
  const { error, value } = validateReminder(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const reminder = createReminder({ userId: req.user.id, reminder: value });
    const emailResult =
      reminder.email_enabled && reminder.reminder_time
        ? await attemptImmediateReminderNotification(reminder)
        : { sent: false };

    return res.status(201).json({
      ...reminder,
      emailSent: Boolean(emailResult.sent),
    });
  } catch (error) {
    return next(error);
  }
};

const editReminder = (req, res) => {
  const { error, value } = validateReminder(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const updatedReminder = updateReminderById({
    id: req.params.id,
    userId: req.user.id,
    reminder: value,
  });

  if (updatedReminder === null) {
    return res.status(404).json({ message: "Reminder not found." });
  }

  if (updatedReminder === false) {
    return res.status(403).json({ message: "You can only update your own reminders." });
  }

  return res.json(updatedReminder);
};

const removeReminder = (req, res) => {
  const deleted = deleteReminderById({ id: req.params.id, userId: req.user.id });

  if (deleted === null) {
    return res.status(404).json({ message: "Reminder not found." });
  }

  if (deleted === false) {
    return res.status(403).json({ message: "You can only delete your own reminders." });
  }

  return res.json({ message: "Reminder deleted successfully." });
};

module.exports = {
  listStudentReminders,
  addReminder,
  editReminder,
  removeReminder,
};
