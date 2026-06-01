const {
  createAnnouncement,
  deleteAnnouncementById,
  getAnnouncements,
  updateAnnouncementById,
} = require("../models/announcementModel");

const listAnnouncements = (_req, res) => {
  const announcements = getAnnouncements();
  return res.json(announcements);
};

const postAnnouncement = (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Announcement title and content are required." });
  }

  const announcement = createAnnouncement({
    title,
    content,
    createdBy: req.user.id,
  });

  return res.status(201).json(announcement);
};

const updateAnnouncement = (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Announcement title and content are required." });
  }

  const announcement = updateAnnouncementById({
    id: req.params.id,
    title,
    content,
  });

  if (!announcement) {
    return res.status(404).json({ message: "Announcement not found." });
  }

  return res.json(announcement);
};

const deleteAnnouncement = (req, res) => {
  const deletedAnnouncement = deleteAnnouncementById(req.params.id);

  if (!deletedAnnouncement) {
    return res.status(404).json({ message: "Announcement not found." });
  }

  return res.json({ message: "Announcement deleted successfully." });
};

module.exports = {
  deleteAnnouncement,
  listAnnouncements,
  postAnnouncement,
  updateAnnouncement,
};
