const express = require("express");
const {
  getUsers,
  getAllReminders,
  updateReminder,
  deleteReminder,
  deleteUser,
} = require("../controllers/adminController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", authenticateToken, requireAdmin, getUsers);
router.get("/admin/reminders", authenticateToken, requireAdmin, getAllReminders);
router.put("/admin/reminders/:id", authenticateToken, requireAdmin, updateReminder);
router.delete("/admin/reminders/:id", authenticateToken, requireAdmin, deleteReminder);
router.delete("/admin/users/:id", authenticateToken, requireAdmin, deleteUser);

module.exports = router;
