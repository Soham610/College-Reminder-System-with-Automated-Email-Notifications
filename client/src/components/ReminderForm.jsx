import { useEffect, useState } from "react";

const baseForm = {
  title: "",
  description: "",
  category: "class",
  reminderDate: "",
  reminderTime: "",
  dayOfWeek: "",
  location: "",
  priority: "medium",
  status: "pending",
  isRecurring: false,
  emailEnabled: true,
};

const buildFormState = ({ initialValues, defaultValues, forcedCategory }) => ({
  ...baseForm,
  ...(defaultValues || {}),
  ...(initialValues || {}),
  ...(forcedCategory ? { category: forcedCategory } : {}),
});

const ReminderForm = ({
  initialValues,
  defaultValues,
  forcedCategory,
  categoryOptions,
  hideCategory = false,
  onSubmit,
  onCancel,
  submitLabel,
  resetSignal,
}) => {
  const [form, setForm] = useState({ ...baseForm });

  useEffect(() => {
    setForm(buildFormState({ initialValues, defaultValues, forcedCategory }));
  }, [initialValues, defaultValues, forcedCategory, resetSignal]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      category: forcedCategory || form.category,
    });
  };

  const showDayField = form.category === "class" || form.category === "club";
  const resolvedCategoryOptions =
    categoryOptions ||
    [
      { value: "class", label: "Class Schedule" },
      { value: "exam", label: "Exam Date" },
      { value: "study", label: "Study Session" },
      { value: "goal", label: "Personal Goal" },
      { value: "club", label: "Club Meeting" },
    ];

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field field-wide">
        <span>Title</span>
        <input name="title" value={form.title} onChange={handleChange} required />
      </label>

      {hideCategory ? (
        <div className="field">
          <span>Category</span>
          <div className="readonly-field">{form.category}</div>
        </div>
      ) : (
        <label className="field">
          <span>Category</span>
          <select name="category" value={form.category} onChange={handleChange}>
            {resolvedCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>Date</span>
        <input
          type="date"
          name="reminderDate"
          value={form.reminderDate}
          onChange={handleChange}
          required
        />
      </label>

      <label className="field">
        <span>Time</span>
        <input
          type="time"
          name="reminderTime"
          value={form.reminderTime}
          onChange={handleChange}
        />
      </label>

      {showDayField ? (
        <label className="field">
          <span>Day</span>
          <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}>
            <option value="">Select Day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </label>
      ) : null}

      <label className="field">
        <span>Location</span>
        <input name="location" value={form.location} onChange={handleChange} />
      </label>

      <label className="field">
        <span>Priority</span>
        <select name="priority" value={form.priority} onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>

      <label className="field">
        <span>Status</span>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <label className="field field-wide">
        <span>Description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows="4"
          placeholder="Add notes, syllabus checkpoints, agenda, or study plan details."
        />
      </label>

      <label className="toggle-field field-wide">
        <input
          type="checkbox"
          name="isRecurring"
          checked={form.isRecurring}
          onChange={handleChange}
        />
        <span>Repeat weekly</span>
      </label>

      <label className="toggle-field field-wide">
        <input
          type="checkbox"
          name="emailEnabled"
          checked={form.emailEnabled}
          onChange={handleChange}
        />
        <span>Send email alert 5 minutes before start time</span>
      </label>

      <div className="button-row field-wide">
        <button type="submit" className="button-primary">
          {submitLabel || "Save Reminder"}
        </button>
        {onCancel ? (
          <button type="button" className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
};

export default ReminderForm;
