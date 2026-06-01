const categoryLabels = {
  class: "Class",
  exam: "Exam",
  study: "Study",
  goal: "Goal",
  club: "Club",
};

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

const ReminderList = ({
  reminders,
  onEdit,
  onDelete,
  emptyMessage,
  showOwner = false,
  readOnly = false,
}) => {
  if (!reminders.length) {
    return <div className="empty-state">{emptyMessage || "No reminders available."}</div>;
  }

  return (
    <div className="reminder-list">
      {reminders.map((reminder) => (
        <article key={reminder.id} className="surface-card reminder-card">
          <div className="reminder-card-top">
            <div>
              <h3>{reminder.title}</h3>
              <div className="badge-row">
                <span className={`badge badge-${reminder.category}`}>
                  {categoryLabels[reminder.category] || reminder.category}
                </span>
                <span className={`badge badge-${reminder.priority}`}>{reminder.priority}</span>
                <span className={`badge badge-status-${reminder.status}`}>{reminder.status}</span>
              </div>
            </div>
            {!readOnly ? (
              <div className="button-row compact">
                <button type="button" className="button-secondary" onClick={() => onEdit(reminder)}>
                  Edit
                </button>
                <button type="button" className="button-danger" onClick={() => onDelete(reminder)}>
                  Delete
                </button>
              </div>
            ) : null}
          </div>

          <div className="reminder-meta">
            <span>{formatDate(reminder.reminderDate)}</span>
            {reminder.reminderTime ? <span>{reminder.reminderTime}</span> : null}
            {reminder.dayOfWeek ? <span>{reminder.dayOfWeek}</span> : null}
            {reminder.location ? <span>{reminder.location}</span> : null}
            {reminder.isRecurring ? <span>Repeats weekly</span> : null}
          </div>

          {showOwner ? (
            <p className="reminder-owner">
              {reminder.ownerName} · {reminder.ownerEmail}
            </p>
          ) : null}

          {reminder.description ? <p className="reminder-description">{reminder.description}</p> : null}
        </article>
      ))}
    </div>
  );
};

export default ReminderList;
