const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getConversation,
  listMessageContacts,
  sendUserMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/contacts", authenticateToken, listMessageContacts);
router.get("/thread", authenticateToken, getConversation);
router.post("/", authenticateToken, sendUserMessage);

module.exports = router;
