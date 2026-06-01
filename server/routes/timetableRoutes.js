const express = require("express");
const {
  listTimetableEntries,
  addTimetableEntry,
  editTimetableEntry,
  removeTimetableEntry,
} = require("../controllers/timetableController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.get("/", listTimetableEntries);
router.post("/", addTimetableEntry);
router.put("/:id", editTimetableEntry);
router.delete("/:id", removeTimetableEntry);

module.exports = router;
