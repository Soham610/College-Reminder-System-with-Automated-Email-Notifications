const { db } = require("./db");

const normalizeMessageBody = (value) => String(value || "").trim();

const getPrimaryAdmin = () =>
  db
    .prepare(
      `
        SELECT id, name, email, department, role, created_at
        FROM users
        WHERE role = 'admin'
        ORDER BY created_at ASC, id ASC
        LIMIT 1
      `
    )
    .get();

const getAdmins = () =>
  db
    .prepare(
      `
        SELECT id, name, email, department, role, created_at
        FROM users
        WHERE role = 'admin'
        ORDER BY created_at ASC, id ASC
      `
    )
    .all();

const getStudentById = (id) =>
  db
    .prepare(
      `
        SELECT id, name, email, department, role, created_at
        FROM users
        WHERE id = ? AND role = 'student'
        LIMIT 1
      `
    )
    .get(id);

const getAdminById = (id) =>
  db
    .prepare(
      `
        SELECT id, name, email, department, role, created_at
        FROM users
        WHERE id = ? AND role = 'admin'
        LIMIT 1
      `
    )
    .get(id);

const createMessage = ({ senderId, recipientId, body }) => {
  const normalizedBody = normalizeMessageBody(body);
  const result = db
    .prepare(
      `
        INSERT INTO messages (sender_id, recipient_id, body)
        VALUES (?, ?, ?)
      `
    )
    .run(senderId, recipientId, normalizedBody);

  return db
    .prepare(
      `
        SELECT
          messages.id,
          messages.sender_id,
          messages.recipient_id,
          messages.body,
          messages.created_at,
          sender.name AS sender_name,
          sender.role AS sender_role,
          recipient.name AS recipient_name,
          recipient.role AS recipient_role
        FROM messages
        JOIN users AS sender ON sender.id = messages.sender_id
        JOIN users AS recipient ON recipient.id = messages.recipient_id
        WHERE messages.id = ?
      `
    )
    .get(result.lastInsertRowid);
};

const getConversationBetweenUsers = ({ userId, otherUserId }) =>
  db
    .prepare(
      `
        SELECT
          messages.id,
          messages.sender_id,
          messages.recipient_id,
          messages.body,
          messages.created_at,
          sender.name AS sender_name,
          sender.role AS sender_role,
          recipient.name AS recipient_name,
          recipient.role AS recipient_role
        FROM messages
        JOIN users AS sender ON sender.id = messages.sender_id
        JOIN users AS recipient ON recipient.id = messages.recipient_id
        WHERE
          (messages.sender_id = ? AND messages.recipient_id = ?)
          OR
          (messages.sender_id = ? AND messages.recipient_id = ?)
        ORDER BY messages.created_at ASC, messages.id ASC
      `
    )
    .all(userId, otherUserId, otherUserId, userId);

const getStudentContactsForAdmin = (adminId) =>
  db
    .prepare(
      `
        SELECT
          users.id,
          users.name,
          users.email,
          users.department,
          users.created_at,
          (
            SELECT messages.body
            FROM messages
            WHERE
              (messages.sender_id = users.id AND messages.recipient_id = @adminId)
              OR
              (messages.sender_id = @adminId AND messages.recipient_id = users.id)
            ORDER BY messages.created_at DESC, messages.id DESC
            LIMIT 1
          ) AS last_message,
          (
            SELECT messages.created_at
            FROM messages
            WHERE
              (messages.sender_id = users.id AND messages.recipient_id = @adminId)
              OR
              (messages.sender_id = @adminId AND messages.recipient_id = users.id)
            ORDER BY messages.created_at DESC, messages.id DESC
            LIMIT 1
          ) AS last_message_at
        FROM users
        WHERE users.role = 'student'
        ORDER BY
          CASE WHEN last_message_at IS NULL THEN 1 ELSE 0 END,
          last_message_at DESC,
          users.name ASC
      `
    )
    .all({ adminId });

module.exports = {
  createMessage,
  getAdmins,
  getAdminById,
  getConversationBetweenUsers,
  getPrimaryAdmin,
  getStudentById,
  getStudentContactsForAdmin,
};
