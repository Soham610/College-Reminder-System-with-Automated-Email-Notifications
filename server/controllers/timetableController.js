const {
  validateTimetableEntry,
  getTimetableEntriesByUserId,
  createTimetableEntry,
  updateTimetableEntryById,
  deleteTimetableEntryById,
} = require("../models/timetableModel");

const listTimetableEntries = (req, res) => {
  const entries = getTimetableEntriesByUserId(req.user.id);
  return res.json(entries);
};

const addTimetableEntry = (req, res) => {
  const { error, value } = validateTimetableEntry(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const entry = createTimetableEntry({ userId: req.user.id, entry: value });
  return res.status(201).json(entry);
};

const editTimetableEntry = (req, res) => {
  const { error, value } = validateTimetableEntry(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const updatedEntry = updateTimetableEntryById({
    id: req.params.id,
    userId: req.user.id,
    entry: value,
  });

  if (updatedEntry === null) {
    return res.status(404).json({ message: "Timetable entry not found." });
  }

  if (updatedEntry === false) {
    return res.status(403).json({ message: "You can only edit your own timetable." });
  }

  return res.json(updatedEntry);
};

const removeTimetableEntry = (req, res) => {
  const deleted = deleteTimetableEntryById({ id: req.params.id, userId: req.user.id });

  if (deleted === null) {
    return res.status(404).json({ message: "Timetable entry not found." });
  }

  if (deleted === false) {
    return res.status(403).json({ message: "You can only delete your own timetable." });
  }

  return res.json({ message: "Timetable entry deleted successfully." });
};

module.exports = {
  listTimetableEntries,
  addTimetableEntry,
  editTimetableEntry,
  removeTimetableEntry,
};
