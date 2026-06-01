const { getAllStudents, deleteStudentById } = require("../models/userModel");
const {
  validateReminder,
  updateReminderById,
  deleteReminderById,
  getReminders,
} = require("../models/reminderModel");

const getUsers = (_req, res) => {
  const users = getAllStudents();
  return res.json(users);
};

const getAllReminders = (req, res) => {
  const reminders = getReminders({
    search: req.query.search || "",
    category: req.query.category || "",
    date: req.query.date || "",
  });

  return res.json(reminders);
};

const updateReminder = (req, res) => {
  const { error, value } = validateReminder(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const updatedReminder = updateReminderById({
    id: req.params.id,
    reminder: value,
    adminOverride: true,
  });

  if (updatedReminder === null) {
    return res.status(404).json({ message: "Reminder not found." });
  }

  return res.json(updatedReminder);
};

const deleteReminder = (req, res) => {
  const deleted = deleteReminderById({
    id: req.params.id,
    adminOverride: true,
  });

  if (deleted === null) {
    return res.status(404).json({ message: "Reminder not found." });
  }

  return res.json({ message: "Reminder deleted successfully." });
};

const deleteUser = (req, res) => {
  const result = deleteStudentById(req.params.id);

  if (!result.changes) {
    return res.status(404).json({ message: "Student not found." });
  }

  return res.json({ message: "Student deleted successfully." });
};

module.exports = {
  getUsers,
  getAllReminders,
  updateReminder,
  deleteReminder,
  deleteUser,
};
