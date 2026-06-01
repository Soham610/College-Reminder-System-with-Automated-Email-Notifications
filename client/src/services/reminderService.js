import { request } from "./api";

const mapReminder = (reminder) => ({
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
  emailEnabled: Boolean(reminder.email_enabled ?? reminder.emailEnabled ?? true),
  ownerName: reminder.owner_name ?? reminder.ownerName ?? "",
  ownerEmail: reminder.owner_email ?? reminder.ownerEmail ?? "",
  createdAt: reminder.created_at ?? reminder.createdAt,
  updatedAt: reminder.updated_at ?? reminder.updatedAt,
  emailSent: Boolean(reminder.emailSent ?? reminder.email_sent ?? false),
});

const mapAnnouncement = (announcement) => ({
  id: announcement.id,
  title: announcement.title,
  content: announcement.content,
  createdAt: announcement.created_at ?? announcement.createdAt,
  authorName: announcement.author_name ?? announcement.authorName ?? "",
});

const serializeReminder = (reminder) => ({
  title: reminder.title,
  description: reminder.description,
  category: reminder.category,
  reminderDate: reminder.reminderDate,
  reminderTime: reminder.reminderTime,
  dayOfWeek: reminder.dayOfWeek,
  location: reminder.location,
  priority: reminder.priority,
  status: reminder.status,
  isRecurring: reminder.isRecurring,
  emailEnabled: reminder.emailEnabled ?? true,
});

export const getReminders = async () => {
  const reminders = await request("/reminders");
  return reminders.map(mapReminder);
};

export const createReminder = async (payload) => {
  const reminder = await request("/reminders", {
    method: "POST",
    body: JSON.stringify(serializeReminder(payload)),
  });

  return mapReminder(reminder);
};

export const updateReminder = async (id, payload) => {
  const reminder = await request(`/reminders/${id}`, {
    method: "PUT",
    body: JSON.stringify(serializeReminder(payload)),
  });

  return mapReminder(reminder);
};

export const deleteReminder = (id) =>
  request(`/reminders/${id}`, {
    method: "DELETE",
  });

export const getAnnouncements = async () => {
  const announcements = await request("/announcements");
  return announcements.map(mapAnnouncement);
};
