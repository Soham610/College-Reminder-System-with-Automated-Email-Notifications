const { db } = require("./db");

const getAnnouncementById = (id) =>
  db
    .prepare(
      `
        SELECT
          announcements.*,
          users.name AS author_name
        FROM announcements
        JOIN users ON users.id = announcements.created_by
        WHERE announcements.id = ?
      `
    )
    .get(id);

const createAnnouncement = ({ title, content, createdBy }) => {
  const result = db
    .prepare(
      `
        INSERT INTO announcements (title, content, created_by)
        VALUES (?, ?, ?)
      `
    )
    .run(title.trim(), content.trim(), createdBy);

  return getAnnouncementById(result.lastInsertRowid);
};

const getAnnouncements = () =>
  db
    .prepare(
      `
        SELECT
          announcements.*,
          users.name AS author_name
        FROM announcements
        JOIN users ON users.id = announcements.created_by
        ORDER BY announcements.created_at DESC
      `
    )
    .all();

const updateAnnouncementById = ({ id, title, content }) => {
  const existing = getAnnouncementById(id);
  if (!existing) {
    return null;
  }

  db.prepare(
    `
      UPDATE announcements
      SET title = ?, content = ?
      WHERE id = ?
    `
  ).run(title.trim(), content.trim(), id);

  return getAnnouncementById(id);
};

const deleteAnnouncementById = (id) => {
  const existing = getAnnouncementById(id);
  if (!existing) {
    return null;
  }

  db.prepare("DELETE FROM announcements WHERE id = ?").run(id);
  return existing;
};

module.exports = {
  createAnnouncement,
  deleteAnnouncementById,
  getAnnouncements,
  updateAnnouncementById,
};
