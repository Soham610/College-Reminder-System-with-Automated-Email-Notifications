const express = require("express");
const {
  listStudentReminders,
  addReminder,
  editReminder,
  removeReminder,
} = require("../controllers/reminderController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.get("/", listStudentReminders);
router.post("/", addReminder);
router.put("/:id", editReminder);
router.delete("/:id", removeReminder);

module.exports = router;
