import { useEffect, useState } from "react";
import PageSection from "./PageSection";
import ReminderForm from "./ReminderForm";
import ReminderList from "./ReminderList";
import { getEmailDiagnostics } from "../services/systemService";
import {
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder,
} from "../services/reminderService";

const reminderCategoryOptions = [
  { value: "exam", label: "Exam Reminder" },
  { value: "study", label: "Study Reminder" },
];

const ReminderSection = () => {
  const [reminders, setReminders] = useState([]);
  const [editingReminder, setEditingReminder] = useState(null);
  const [status, setStatus] = useState("");
  const [emailDiagnostics, setEmailDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const [data, diagnostics] = await Promise.all([getReminders(), getEmailDiagnostics()]);
        setReminders(data.filter((reminder) => reminder.category !== "class" && reminder.category !== "goal"));
        setEmailDiagnostics(diagnostics);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, []);

  const handleSaveReminder = async (payload) => {
    try {
      if (editingReminder) {
        const updatedReminder = await updateReminder(editingReminder.id, payload);
        setReminders((current) =>
          current.map((reminder) => (reminder.id === updatedReminder.id ? updatedReminder : reminder))
        );
        setStatus("Reminder updated successfully.");
      } else {
        const newReminder = await createReminder(payload);
        setReminders((current) => [newReminder, ...current]);
        setResetSignal((current) => current + 1);
        setStatus(
          newReminder.emailSent
            ? "THE EMAIL HAS BEEN SENT TO THE USER SUCCESSFULLY"
            : "Reminder saved successfully."
        );
      }

      setEditingReminder(null);
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
      await deleteReminder(reminder.id);
      setReminders((current) => current.filter((item) => item.id !== reminder.id));
      setEditingReminder((current) => (current?.id === reminder.id ? null : current));
      setStatus("Reminder deleted successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="section-stack">
      {status ? <div className="status-banner">{status}</div> : null}
      {emailDiagnostics && !emailDiagnostics.ready ? (
        <div className="status-banner">
          Email reminders are currently unavailable. {emailDiagnostics.message}
        </div>
      ) : null}

      <PageSection
        title={editingReminder ? "Edit Reminder" : "Add Reminder"}
        subtitle="This section is reserved only for reminders. Your reminder form will not appear in timetable or goals."
      >
        <ReminderForm
          initialValues={editingReminder}
          defaultValues={{
            category: "exam",
            priority: "medium",
            status: "pending",
            emailEnabled: false,
          }}
          categoryOptions={reminderCategoryOptions}
          onSubmit={handleSaveReminder}
          onCancel={editingReminder ? () => setEditingReminder(null) : undefined}
          submitLabel={editingReminder ? "Update Reminder" : "Save Reminder"}
          resetSignal={resetSignal}
        />
      </PageSection>

      <PageSection title="View Reminders" subtitle="Saved reminders stay available after refresh and after logging out.">
        {loading ? (
          <div className="empty-state">Loading reminders...</div>
        ) : (
          <ReminderList
            reminders={reminders}
            onEdit={setEditingReminder}
            onDelete={handleDeleteReminder}
            emptyMessage="No reminders have been added yet."
          />
        )}
      </PageSection>
    </div>
  );
};

export default ReminderSection;
