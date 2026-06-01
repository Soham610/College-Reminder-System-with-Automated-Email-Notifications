import { request } from "./api";
import { getAnnouncements } from "./reminderService";

const mapStudent = (student) => ({
  id: student.id,
  name: student.name,
  email: student.email,
  department: student.department || "General",
  reminderCount: student.reminder_count ?? student.reminderCount ?? 0,
  createdAt: student.created_at ?? student.createdAt,
});

export const getUsers = async () => {
  const users = await request("/users");
  return users.map(mapStudent);
};

export const getAllReminders = async () => {
  const reminders = await request("/admin/reminders");
  return reminders.map((reminder) => ({
    id: reminder.id,
    userId: reminder.user_id ?? reminder.userId,
    title: reminder.title,
    description: reminder.description || "",
    category: reminder.category,
    reminderDate: reminder.reminder_date ?? reminder.reminderDate,
    reminderTime: reminder.reminder_time ?? reminder.reminderTime ?? "",
    dayOfWeek: reminder.day_of_week ?? reminder.dayOfWeek ?? "",
    location: reminder.location || "",
    priority: reminder.priority,
    status: reminder.status,
    isRecurring: Boolean(reminder.is_recurring ?? reminder.isRecurring),
    ownerName: reminder.owner_name ?? reminder.ownerName ?? "",
    ownerEmail: reminder.owner_email ?? reminder.ownerEmail ?? "",
    createdAt: reminder.created_at ?? reminder.createdAt,
    updatedAt: reminder.updated_at ?? reminder.updatedAt,
  }));
};

export const updateReminderAsAdmin = async (id, payload) => {
  const reminder = await request(`/admin/reminders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return {
    id: reminder.id,
    userId: reminder.user_id ?? reminder.userId,
    title: reminder.title,
    description: reminder.description || "",
    category: reminder.category,
    reminderDate: reminder.reminder_date ?? reminder.reminderDate,
    reminderTime: reminder.reminder_time ?? reminder.reminderTime ?? "",
    dayOfWeek: reminder.day_of_week ?? reminder.dayOfWeek ?? "",
    location: reminder.location || "",
    priority: reminder.priority,
    status: reminder.status,
    isRecurring: Boolean(reminder.is_recurring ?? reminder.isRecurring),
    ownerName: reminder.owner_name ?? reminder.ownerName ?? "",
    ownerEmail: reminder.owner_email ?? reminder.ownerEmail ?? "",
    createdAt: reminder.created_at ?? reminder.createdAt,
    updatedAt: reminder.updated_at ?? reminder.updatedAt,
  };
};

export const deleteReminderAsAdmin = (id) =>
  request(`/admin/reminders/${id}`, {
    method: "DELETE",
  });

export const deleteUser = (id) =>
  request(`/admin/users/${id}`, {
    method: "DELETE",
  });

export const postAnnouncement = (payload) =>
  request("/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAnnouncementAsAdmin = (id, payload) =>
  request(`/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteAnnouncementAsAdmin = (id) =>
  request(`/announcements/${id}`, {
    method: "DELETE",
  });

export { getAnnouncements };
