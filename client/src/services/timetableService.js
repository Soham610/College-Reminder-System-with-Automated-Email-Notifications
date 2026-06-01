import { request } from "./api";

const mapEntry = (entry) => ({
  id: entry.id,
  userId: entry.user_id ?? entry.userId,
  dayOfWeek: entry.day_of_week ?? entry.dayOfWeek,
  subject: entry.subject,
  timeLabel: entry.time_label ?? entry.timeLabel,
  startTime: entry.start_time ?? entry.startTime ?? "",
  endTime: entry.end_time ?? entry.endTime ?? "",
  location: entry.location || "",
  emailEnabled: Boolean(entry.email_enabled ?? entry.emailEnabled ?? true),
  createdAt: entry.created_at ?? entry.createdAt,
  updatedAt: entry.updated_at ?? entry.updatedAt,
});

const serializeEntry = (entry) => ({
  dayOfWeek: entry.dayOfWeek,
  subject: entry.subject,
  timeLabel: entry.timeLabel,
  startTime: entry.startTime,
  endTime: entry.endTime,
  location: entry.location,
  emailEnabled: entry.emailEnabled ?? true,
});

export const getTimetableEntries = async () => {
  const entries = await request("/timetable");
  return entries.map(mapEntry);
};

export const createTimetableEntry = async (payload) => {
  const entry = await request("/timetable", {
    method: "POST",
    body: JSON.stringify(serializeEntry(payload)),
  });

  return mapEntry(entry);
};

export const updateTimetableEntry = async (id, payload) => {
  const entry = await request(`/timetable/${id}`, {
    method: "PUT",
    body: JSON.stringify(serializeEntry(payload)),
  });

  return mapEntry(entry);
};

export const deleteTimetableEntry = (id) =>
  request(`/timetable/${id}`, {
    method: "DELETE",
  });
