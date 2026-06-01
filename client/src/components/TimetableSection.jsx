import { useEffect, useRef, useState } from "react";
import PageSection from "./PageSection";
import {
  createTimetableEntry,
  deleteTimetableEntry,
  getTimetableEntries,
  updateTimetableEntry,
} from "../services/timetableService";

const orderedDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const baseForm = {
  subject: "",
  startTime: "",
  endTime: "",
  location: "",
  emailEnabled: true,
};

const buildTimeLabel = ({ startTime, endTime }) => {
  if (!startTime) {
    return "";
  }

  return endTime ? `${startTime} - ${endTime}` : startTime;
};

const TimetableSection = () => {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(baseForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [isDayTransitioning, setIsDayTransitioning] = useState(false);
  const submitResetTimeoutRef = useRef(null);
  const dayTransitionTimeoutRef = useRef(null);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await getTimetableEntries();
        setEntries(data);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  useEffect(() => {
    if (!isSubmitting) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSaveProgress((current) => {
        if (current >= 92) {
          return current;
        }

        return Math.min(current + Math.floor(Math.random() * 16) + 4, 92);
      });
    }, 140);

    return () => window.clearInterval(intervalId);
  }, [isSubmitting]);

  useEffect(
    () => () => {
      if (submitResetTimeoutRef.current) {
        window.clearTimeout(submitResetTimeoutRef.current);
      }

      if (dayTransitionTimeoutRef.current) {
        window.clearTimeout(dayTransitionTimeoutRef.current);
      }
    },
    []
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const finishSubmitAnimation = () => {
    setSaveProgress(100);

    submitResetTimeoutRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setSaveProgress(0);
      setProgressLabel("");
    }, 520);
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    setEditingId(null);
    setForm(baseForm);
    setIsDayTransitioning(true);

    if (dayTransitionTimeoutRef.current) {
      window.clearTimeout(dayTransitionTimeoutRef.current);
    }

    dayTransitionTimeoutRef.current = window.setTimeout(() => {
      setIsDayTransitioning(false);
    }, 650);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      dayOfWeek: selectedDay,
      subject: form.subject,
      startTime: form.startTime,
      endTime: form.endTime,
      timeLabel: buildTimeLabel(form),
      location: form.location,
      emailEnabled: form.emailEnabled,
    };

    setIsSubmitting(true);
    setSaveProgress(12);
    setProgressLabel(editingId ? `Updating ${selectedDay} schedule...` : `Saving ${selectedDay} schedule...`);

    try {
      if (editingId) {
        const updatedEntry = await updateTimetableEntry(editingId, payload);
        setEntries((current) => current.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)));
        setStatus(`Updated ${selectedDay} timetable entry.`);
      } else {
        const newEntry = await createTimetableEntry(payload);
        setEntries((current) => [...current, newEntry]);
        setStatus(`Saved ${selectedDay} timetable entry.`);
      }

      setEditingId(null);
      setForm(baseForm);
      finishSubmitAnimation();
    } catch (error) {
      setIsSubmitting(false);
      setSaveProgress(0);
      setProgressLabel("");
      setStatus(error.message);
    }
  };

  const handleEdit = (entry) => {
    setSelectedDay(entry.dayOfWeek);
    setEditingId(entry.id);
    setForm({
      subject: entry.subject,
      startTime: entry.startTime,
      endTime: entry.endTime,
      location: entry.location,
      emailEnabled: entry.emailEnabled,
    });
  };

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(`Delete "${entry.subject}" from the timetable?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteTimetableEntry(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (editingId === entry.id) {
        setEditingId(null);
        setForm(baseForm);
      }
      setStatus("Timetable entry deleted successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const entriesForSelectedDay = entries.filter((entry) => entry.dayOfWeek === selectedDay);

  return (
    <div className="section-stack">
      {status ? <div className="status-banner">{status}</div> : null}

      <PageSection
        title="Interactive Timetable"
        subtitle="Each class can send an email reminder 5 minutes before the start time."
      >
        <div className="day-grid">
          {orderedDays.map((day) => (
            <button
              key={day}
              type="button"
              className={`day-pill ${selectedDay === day ? "active" : ""}`}
              onClick={() => handleSelectDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </PageSection>

      {isSubmitting || isDayTransitioning ? (
        <div className="surface-card timetable-sync-panel">
          <div>
            <strong>{isSubmitting ? progressLabel : `Refreshing ${selectedDay} timetable...`}</strong>
            <p>
              {isSubmitting
                ? "Creating a smooth save flow with live sync feedback."
                : "Loading the selected day with a polished transition."}
            </p>
          </div>
          <div className="loading-bar-track" aria-hidden="true">
            {isSubmitting ? (
              <span className="loading-bar-fill" style={{ width: `${saveProgress}%` }} />
            ) : (
              <span className="loading-bar-fill indeterminate" />
            )}
          </div>
        </div>
      ) : null}

      <div className="dashboard-grid split-layout">
        <PageSection
          title={`${selectedDay} Entry`}
          subtitle="Add a class with a start time so the system can email the student before it begins."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field field-wide">
              <span>Subject</span>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Operating Systems"
                required
              />
            </label>

            <label className="field">
              <span>Start Time</span>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required />
            </label>

            <label className="field">
              <span>End Time</span>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} />
            </label>

            <label className="field field-wide">
              <span>Room</span>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Block A - 204"
              />
            </label>

            <label className="toggle-field field-wide">
              <input
                type="checkbox"
                name="emailEnabled"
                checked={form.emailEnabled}
                onChange={handleChange}
              />
              <span>Send a class email reminder 5 minutes before the start time</span>
            </label>

            <div className="button-row field-wide">
              <button type="submit" className="button-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingId ? "Update Entry" : `Save ${selectedDay}`}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="button-secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingId(null);
                    setForm(baseForm);
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </PageSection>

        <PageSection title={`${selectedDay} Timetable`} subtitle="Saved classes for the selected day.">
          {loading ? (
            <div className="timetable-loading-state">
              <div className="loading-bar-track" aria-hidden="true">
                <span className="loading-bar-fill indeterminate" />
              </div>
              <div className="empty-state shimmer-panel">Loading timetable...</div>
            </div>
          ) : entriesForSelectedDay.length ? (
            <div className="timetable-list">
              {entriesForSelectedDay.map((entry) => (
                <article key={entry.id} className="surface-subcard timetable-row">
                  <div>
                    <h3>{entry.subject}</h3>
                    <p>{entry.timeLabel}</p>
                    {entry.location ? <small>{entry.location}</small> : null}
                    <small className="helper-copy">
                      Email alert: {entry.emailEnabled ? "Enabled" : "Disabled"}
                    </small>
                  </div>
                  <div className="button-row compact">
                    <button type="button" className="button-secondary" onClick={() => handleEdit(entry)}>
                      Edit
                    </button>
                    <button type="button" className="button-danger" onClick={() => handleDelete(entry)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No classes saved for {selectedDay}.</div>
          )}
        </PageSection>
      </div>
    </div>
  );
};

export default TimetableSection;
