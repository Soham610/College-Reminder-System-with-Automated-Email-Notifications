const {
  createMessage,
  getAdmins,
  getAdminById,
  getConversationBetweenUsers,
  getPrimaryAdmin,
  getStudentById,
  getStudentContactsForAdmin,
} = require("../models/messageModel");

const serializeUser = (user) =>
  user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department || "",
        role: user.role,
        createdAt: user.created_at,
      }
    : null;

const serializeMessage = (message) => ({
  id: message.id,
  senderId: message.sender_id,
  recipientId: message.recipient_id,
  body: message.body,
  createdAt: message.created_at,
  senderName: message.sender_name,
  senderRole: message.sender_role,
  recipientName: message.recipient_name,
  recipientRole: message.recipient_role,
});

const listMessageContacts = (req, res) => {
  if (req.user.role === "admin") {
    const contacts = getStudentContactsForAdmin(req.user.id).map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      department: student.department || "",
      lastMessage: student.last_message || "",
      lastMessageAt: student.last_message_at || null,
    }));

    return res.json({
      contacts,
    });
  }

  return res.json({
    contacts: getAdmins().map(serializeUser),
  });
};

const getConversation = (req, res) => {
  const requestedUserId = Number(req.query.userId || 0);
  let counterpart = null;

  if (req.user.role === "admin") {
    counterpart = requestedUserId ? getStudentById(requestedUserId) : null;

    if (!counterpart) {
      return res.status(400).json({ message: "Please select a student to view messages." });
    }
  } else {
    counterpart =
      (requestedUserId ? getAdminById(requestedUserId) : null) || getPrimaryAdmin();

    if (!counterpart) {
      return res.status(404).json({ message: "No admin account is available for messaging right now." });
    }
  }

  return res.json({
    counterpart: serializeUser(counterpart),
    messages: getConversationBetweenUsers({
      userId: req.user.id,
      otherUserId: counterpart.id,
    }).map(serializeMessage),
  });
};

const sendUserMessage = (req, res) => {
  const body = String(req.body.body || "").trim();
  if (!body) {
    return res.status(400).json({ message: "Message text is required." });
  }

  let recipient = null;
  if (req.user.role === "admin") {
    recipient = getStudentById(Number(req.body.recipientId || 0));
    if (!recipient) {
      return res.status(400).json({ message: "Please choose a valid student to contact." });
    }
  } else {
    recipient =
      (req.body.recipientId ? getAdminById(Number(req.body.recipientId)) : null) ||
      getPrimaryAdmin();

    if (!recipient) {
      return res.status(404).json({ message: "No admin account is available for messaging right now." });
    }
  }

  const message = createMessage({
    senderId: req.user.id,
    recipientId: recipient.id,
    body,
  });

  return res.status(201).json({
    message: serializeMessage(message),
    counterpart: serializeUser(recipient),
  });
};

module.exports = {
  getConversation,
  listMessageContacts,
  sendUserMessage,
};
