const express = require("express");
const {
  deleteAnnouncement,
  listAnnouncements,
  postAnnouncement,
  updateAnnouncement,
} = require("../controllers/announcementController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, listAnnouncements);
router.post("/", authenticateToken, requireAdmin, postAnnouncement);
router.put("/:id", authenticateToken, requireAdmin, updateAnnouncement);
router.delete("/:id", authenticateToken, requireAdmin, deleteAnnouncement);

module.exports = router;
