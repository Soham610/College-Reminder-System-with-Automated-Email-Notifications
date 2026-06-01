const { db } = require("./db");

const createUser = ({ name, email, passwordHash, department, role = "student" }) => {
  const result = db
    .prepare(
      `
        INSERT INTO users (name, email, password_hash, department, role)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(name, email.toLowerCase(), passwordHash, department || null, role);

  return db
    .prepare(
      `
        SELECT id, name, email, department, role, created_at
        FROM users
        WHERE id = ?
      `
    )
    .get(result.lastInsertRowid);
};

const findUserByEmail = (email) =>
  db
    .prepare(
      `
        SELECT id, name, email, password_hash, department, role, created_at
        FROM users
        WHERE email = ?
        LIMIT 1
      `
    )
    .get(email.toLowerCase());

const findUserByIdentifier = ({ identifier, role }) =>
  db
    .prepare(
      `
        SELECT id, name, email, password_hash, department, role, created_at
        FROM users
        WHERE role = ?
          AND (
            LOWER(email) = LOWER(?)
            OR LOWER(name) = LOWER(?)
          )
        LIMIT 1
      `
    )
    .get(role, identifier.trim(), identifier.trim());

const findUserById = (id) =>
  db
    .prepare(
      `
        SELECT id, name, email, department, role, created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(id);

const getAllStudents = () =>
  db
    .prepare(
      `
        SELECT
          users.id,
          users.name,
          users.email,
          users.department,
          users.created_at,
          COUNT(reminders.id) AS reminder_count
        FROM users
        LEFT JOIN reminders ON reminders.user_id = users.id
        WHERE users.role = 'student'
        GROUP BY users.id
        ORDER BY users.created_at DESC
      `
    )
    .all();

const deleteStudentById = (id) =>
  db
    .prepare(
      `
        DELETE FROM users
        WHERE id = ? AND role = 'student'
      `
    )
    .run(id);

const updateUserPasswordById = ({ id, passwordHash }) =>
  db
    .prepare(
      `
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
      `
    )
    .run(passwordHash, id);

module.exports = {
  createUser,
  findUserByIdentifier,
  findUserByEmail,
  findUserById,
  getAllStudents,
  deleteStudentById,
  updateUserPasswordById,
};
