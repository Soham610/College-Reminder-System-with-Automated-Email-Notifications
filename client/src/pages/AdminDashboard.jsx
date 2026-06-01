import { useEffect, useState } from "react";
import AnnouncementBoard from "../components/AnnouncementBoard";
import AdminMessagesPanel from "../components/AdminMessagesPanel";
import DashboardCard from "../components/DashboardCard";
import PageSection from "../components/PageSection";
import ReminderForm from "../components/ReminderForm";
import ReminderList from "../components/ReminderList";
import StatCard from "../components/StatCard";
import { clearSession } from "../services/authStorage";
import {
  deleteAnnouncementAsAdmin,
  deleteReminderAsAdmin,
  deleteUser,
  getAllReminders,
  getAnnouncements,
  getUsers,
  postAnnouncement,
  updateAnnouncementAsAdmin,
  updateReminderAsAdmin,
} from "../services/adminService";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState("students");
  const [users, setUsers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminDashboard = async () => {
      try {
        const [userData, reminderData, announcementData] = await Promise.all([
          getUsers(),
          getAllReminders(),
          getAnnouncements(),
        ]);

        setUsers(userData);
        setReminders(reminderData);
        setAnnouncements(announcementData);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAdminDashboard();
  }, []);

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete student account for ${user.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setReminders((current) => current.filter((item) => item.userId !== user.id));
      setStatus("Student deleted successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleDeleteReminder = async (reminder) => {
    const confirmed = window.confirm(`Delete reminder "${reminder.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteReminderAsAdmin(reminder.id);
      setReminders((current) => current.filter((item) => item.id !== reminder.id));
      setEditingReminder((current) => (current?.id === reminder.id ? null : current));
      setStatus("Reminder deleted successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleUpdateReminder = async (payload) => {
    if (!editingReminder) {
      return;
    }

    try {
      const updatedReminder = await updateReminderAsAdmin(editingReminder.id, payload);
      setReminders((current) =>
        current.map((reminder) => (reminder.id === updatedReminder.id ? updatedReminder : reminder))
      );
      setEditingReminder(null);
      setStatus("Reminder updated successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleAnnouncementChange = (event) => {
    const { name, value } = event.target;
    setAnnouncementForm((current) => ({ ...current, [name]: value }));
  };

  const handlePostAnnouncement = async (event) => {
    event.preventDefault();

    try {
      if (editingAnnouncementId) {
        const updatedAnnouncement = await updateAnnouncementAsAdmin(editingAnnouncementId, announcementForm);
        setAnnouncements((current) =>
          current.map((announcement) =>
            announcement.id === editingAnnouncementId
              ? {
                  id: updatedAnnouncement.id,
                  title: updatedAnnouncement.title,
                  content: updatedAnnouncement.content,
                  createdAt: updatedAnnouncement.created_at ?? updatedAnnouncement.createdAt,
                  authorName: updatedAnnouncement.author_name ?? updatedAnnouncement.authorName,
                }
              : announcement
          )
        );
        setStatus("Announcement updated successfully.");
      } else {
        const announcement = await postAnnouncement(announcementForm);
        setAnnouncements((current) => [
          {
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            createdAt: announcement.created_at ?? announcement.createdAt,
            authorName: announcement.author_name ?? announcement.authorName,
          },
          ...current,
        ]);
        setStatus("Announcement posted successfully.");
      }

      setEditingAnnouncementId(null);
      setAnnouncementForm({ title: "", content: "" });
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncementId(announcement.id);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
    });
  };

  const handleDeleteAnnouncement = async (announcement) => {
    const confirmed = window.confirm(`Delete announcement "${announcement.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteAnnouncementAsAdmin(announcement.id);
      setAnnouncements((current) => current.filter((item) => item.id !== announcement.id));

      if (editingAnnouncementId === announcement.id) {
        setEditingAnnouncementId(null);
        setAnnouncementForm({ title: "", content: "" });
      }

      setStatus("Announcement deleted successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/admin/login", { replace: true });
  };

  const stats = {
    students: users.length,
    reminders: reminders.length,
    announcements: announcements.length,
  };

  return (
    <div className="dashboard-page page-shell">
      <header className="topbar surface-card">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="page-title">College Reminder Admin</h1>
          <p className="topbar-copy">Manage student accounts, reminders, and official announcements.</p>
        </div>
        <button type="button" className="button-secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="stat-grid">
        <StatCard label="Students" value={stats.students} accent="accent-primary" />
        <StatCard label="Reminders" value={stats.reminders} accent="accent-secondary" />
        <StatCard label="Announcements" value={stats.announcements} accent="accent-primary" />
      </section>

      <section className="card-selector">
        <DashboardCard
          title="Students"
          subtitle="Review registered student accounts"
          active={selectedSection === "students"}
          onClick={() => setSelectedSection("students")}
        />
        <DashboardCard
          title="Reminders"
          subtitle="Edit and moderate reminder records"
          active={selectedSection === "reminders"}
          onClick={() => setSelectedSection("reminders")}
        />
        <DashboardCard
          title="Announcements"
          subtitle="Publish notices for all students"
          active={selectedSection === "announcements"}
          onClick={() => setSelectedSection("announcements")}
        />
      </section>

      {status ? <div className="status-banner">{status}</div> : null}

      {loading ? <div className="surface-card empty-state">Loading admin data...</div> : null}

      {selectedSection === "students" && !loading ? (
        <PageSection title="Student Directory" subtitle="Active student accounts in the system.">
          <div className="student-grid">
            {users.length ? (
              users.map((user) => (
                <article key={user.id} className="surface-subcard student-card">
                  <div>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <small>{user.department}</small>
                  </div>
                  <div className="student-meta">
                    <span>{user.reminderCount} reminders</span>
                    <button type="button" className="button-danger" onClick={() => handleDeleteUser(user)}>
                      Delete User
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No students found.</div>
            )}
          </div>
        </PageSection>
      ) : null}

      {selectedSection === "reminders" && !loading ? (
        <div className="dashboard-grid split-layout">
          <PageSection title="Reminder Management" subtitle="Review and edit reminders across the system.">
            <ReminderList
              reminders={reminders}
              onEdit={setEditingReminder}
              onDelete={handleDeleteReminder}
              showOwner
              emptyMessage="No reminders are available."
            />
          </PageSection>

          <PageSection
            title={editingReminder ? "Edit Reminder" : "Reminder Editor"}
            subtitle={
              editingReminder
                ? "Update the selected reminder and save the changes."
                : "Choose a reminder from the list to edit it here."
            }
          >
            {editingReminder ? (
              <ReminderForm
                initialValues={editingReminder}
                onSubmit={handleUpdateReminder}
                onCancel={() => setEditingReminder(null)}
                submitLabel="Update Reminder"
              />
            ) : (
              <div className="empty-state">Select a reminder to begin editing.</div>
            )}
          </PageSection>
        </div>
      ) : null}

      {selectedSection === "announcements" && !loading ? (
        <div className="dashboard-grid split-layout">
          <PageSection
            title={editingAnnouncementId ? "Edit Announcement" : "Post Announcement"}
            subtitle={
              editingAnnouncementId
                ? "Update the selected announcement and publish the changes."
                : "Share institution-wide updates for students."
            }
          >
            <form className="form-grid" onSubmit={handlePostAnnouncement}>
              <label className="field field-wide">
                <span>Title</span>
                <input
                  name="title"
                  value={announcementForm.title}
                  onChange={handleAnnouncementChange}
                  required
                />
              </label>

              <label className="field field-wide">
                <span>Content</span>
                <textarea
                  name="content"
                  value={announcementForm.content}
                  onChange={handleAnnouncementChange}
                  rows="6"
                  required
                />
              </label>

              <div className="button-row field-wide">
                <button type="submit" className="button-primary">
                  {editingAnnouncementId ? "Update Announcement" : "Post Announcement"}
                </button>
                {editingAnnouncementId ? (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => {
                      setEditingAnnouncementId(null);
                      setAnnouncementForm({ title: "", content: "" });
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </PageSection>

          <div className="side-stack">
            <PageSection title="Published Announcements" subtitle="Recent notices visible to students.">
              <AnnouncementBoard
                announcements={announcements}
                actions={(announcement) => (
                  <>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => handleEditAnnouncement(announcement)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDeleteAnnouncement(announcement)}
                    >
                      Delete
                    </button>
                  </>
                )}
              />
            </PageSection>

            <PageSection title="Contact Users" subtitle="Select a student, read messages, and send replies.">
              <AdminMessagesPanel />
            </PageSection>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
