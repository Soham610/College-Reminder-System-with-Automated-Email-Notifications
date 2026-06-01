import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageSection from "./PageSection";

const pad = (value) => String(value).padStart(2, "0");

const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${pad(mins)}:${pad(secs)}`;
};

const FocusModeSection = () => {
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [settings, setSettings] = useState({
    sessions: 4,
    studyMinutes: 25,
    breakMinutes: 5,
  });
  const [focusState, setFocusState] = useState({
    running: false,
    phase: "study",
    currentSession: 1,
    remainingSeconds: 25 * 60,
    completed: false,
  });

  const totalSeconds = useMemo(
    () =>
      focusState.phase === "study"
        ? settings.studyMinutes * 60
        : settings.breakMinutes * 60,
    [focusState.phase, settings.breakMinutes, settings.studyMinutes]
  );

  useEffect(() => {
    if (!focusState.running) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFocusState((current) => {
        if (current.remainingSeconds > 1) {
          return {
            ...current,
            remainingSeconds: current.remainingSeconds - 1,
          };
        }

        if (current.phase === "study") {
          if (current.currentSession >= settings.sessions) {
            return {
              ...current,
              completed: true,
              running: false,
              remainingSeconds: 0,
            };
          }

          return {
            ...current,
            phase: "break",
            remainingSeconds: settings.breakMinutes * 60,
          };
        }

        return {
          ...current,
          phase: "study",
          currentSession: current.currentSession + 1,
          remainingSeconds: settings.studyMinutes * 60,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [focusState.running, settings.breakMinutes, settings.sessions, settings.studyMinutes]);

  const progressPercent = totalSeconds
    ? Math.max(0, Math.min(100, ((totalSeconds - focusState.remainingSeconds) / totalSeconds) * 100))
    : 0;
  const auraProgress = focusState.completed || focusState.remainingSeconds === 0 ? 0 : progressPercent / 100;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: Math.max(1, Number(value) || 1),
    }));
  };

  const handleStart = (event) => {
    event.preventDefault();
    setFocusState({
      running: true,
      phase: "study",
      currentSession: 1,
      remainingSeconds: settings.studyMinutes * 60,
      completed: false,
    });
    setShowSetup(false);
  };

  const handlePauseResume = () => {
    setFocusState((current) => ({
      ...current,
      running: !current.running,
    }));
  };

  const handleReset = () => {
    setFocusState({
      running: false,
      phase: "study",
      currentSession: 1,
      remainingSeconds: settings.studyMinutes * 60,
      completed: false,
    });
  };

  const handleStopFocusMode = () => {
    handleReset();
    setShowSetup(false);
    navigate("/dashboard/goals");
  };

  return (
    <div className="section-stack focus-mode-page">
      {showSetup ? <div className="focus-blur-screen" aria-hidden="true" /> : null}

      <PageSection
        title="Focus Mode"
        subtitle="Run timed study sessions with automatic breaks until your target session count is completed."
        actions={
          <div className="button-row">
            <button type="button" className="button-primary" onClick={() => setShowSetup(true)}>
              Configure Focus Plan
            </button>
            <button type="button" className="button-danger" onClick={handleStopFocusMode}>
              Stop Focus Mode
            </button>
          </div>
        }
      >
        <div className="focus-hero">
          <div>
            <p className="helper-copy">
              Set your study rhythm once and let the timer shift between deep work and short recovery breaks.
            </p>
            <div className="focus-chip-row">
              <span className="focus-chip">{settings.sessions} sessions</span>
              <span className="focus-chip">{settings.studyMinutes} min study</span>
              <span className="focus-chip">{settings.breakMinutes} min break</span>
            </div>
          </div>

          <div className="focus-timer-card">
            <p>{focusState.phase === "study" ? "Study Timer" : "Break Timer"}</p>
            <strong>{formatSeconds(focusState.remainingSeconds)}</strong>
            <span>
              Session {Math.min(focusState.currentSession, settings.sessions)} of {settings.sessions}
            </span>
          </div>
        </div>

        {focusState.completed ? (
          <div className="focus-complete-banner" role="status" aria-live="polite">
            <strong>Hurray, You Did It!</strong>
            <span>Your full focus cycle is complete. Take a deep breath and enjoy the progress you made.</span>
          </div>
        ) : null}

        <div className="focus-progress-shell">
          <span className="focus-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="button-row">
          <button
            type="button"
            className="button-primary"
            onClick={focusState.completed ? () => setShowSetup(true) : handlePauseResume}
          >
            {focusState.completed ? "Start Another Focus Plan" : focusState.running ? "Pause Timer" : "Resume Timer"}
          </button>
          <button type="button" className="button-secondary" onClick={handleReset}>
            Reset Timer
          </button>
        </div>

        <div
          className="focus-scene focus-scene-buddha"
          style={{
            "--focus-aura-progress": auraProgress.toFixed(3),
          }}
          aria-hidden="true"
        >
          <div className="focus-scene-orb" />
          <div className="focus-scene-ground" />
          <p className="focus-scene-caption">
            Let the light build with every minute of focus.
          </p>
        </div>
      </PageSection>

      {showSetup ? (
        <div className="focus-modal-shell" role="dialog" aria-modal="true" aria-label="Configure focus mode">
          <section className="focus-modal surface-card">
            <div className="focus-modal-copy">
              <p className="eyebrow">Focus Mode</p>
              <h2>Build Your Study Cycle</h2>
              <p>Choose how many study sessions you want, how long each session lasts, and how long the recovery break should be.</p>
            </div>

            <form className="form-grid" onSubmit={handleStart}>
              <label className="field">
                <span>No. of Study Sessions</span>
                <input type="number" min="1" max="12" name="sessions" value={settings.sessions} onChange={handleChange} />
              </label>

              <label className="field">
                <span>Study Session Length</span>
                <input type="number" min="1" max="180" name="studyMinutes" value={settings.studyMinutes} onChange={handleChange} />
              </label>

              <label className="field field-wide">
                <span>Break Length</span>
                <input type="number" min="1" max="60" name="breakMinutes" value={settings.breakMinutes} onChange={handleChange} />
              </label>

              <div className="button-row field-wide">
                <button type="submit" className="button-primary">
                  Start Focus Mode
                </button>
                <button type="button" className="button-danger" onClick={handleStopFocusMode}>
                  Stop Focus Mode
                </button>
                <button type="button" className="button-secondary" onClick={() => setShowSetup(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default FocusModeSection;
