const orderedDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TimetableBoard = ({ reminders }) => {
  const groupedReminders = orderedDays.map((day) => ({
    day,
    reminders: reminders.filter((reminder) => reminder.dayOfWeek === day),
  }));

  return (
    <div className="timetable-grid">
      {groupedReminders.map((group) => (
        <article key={group.day} className="timetable-card">
          <h3>{group.day}</h3>
          {group.reminders.length ? (
            group.reminders.map((reminder) => (
              <div key={reminder.id} className="timetable-item">
                <strong>{reminder.title}</strong>
                <span>{reminder.reminderTime || "Time flexible"}</span>
                {reminder.location ? <small>{reminder.location}</small> : null}
              </div>
            ))
          ) : (
            <p className="timetable-empty">No scheduled classes.</p>
          )}
        </article>
      ))}
    </div>
  );
};

export default TimetableBoard;
