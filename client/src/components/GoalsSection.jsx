import { useEffect, useMemo, useState } from "react";
import PageSection from "./PageSection";
import { changeGoalState, createGoal, deleteGoal, getGoalsDashboard } from "../services/goalService";
import { addStoredXp, getStoredXp } from "../services/gamificationStorage";

const formatDayAndDate = (date = new Date()) => {
  const day = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(date);
  const fullDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return { day, fullDate };
};

const formatGoalDate = (dateValue, timeValue) => {
  if (!dateValue) {
    return "No deadline";
  }

  const dateText = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

  return timeValue ? `${dateText} · ${timeValue}` : dateText;
};

const getDeliveryLabel = (deliveryStatus) => {
  if (deliveryStatus === "sent") {
    return "Delivered to your inbox";
  }

  if (deliveryStatus === "preview") {
    return "Live preview";
  }

  return "Saved to dashboard";
};

const buildLiveSummary = ({ goals, currentProgress, summaryDate, userName }) => {
  const relevantGoals = goals.filter((goal) => goal.status !== "cancelled");
  const completedGoalTitles = relevantGoals
    .filter((goal) => goal.status === "completed")
    .map((goal) => goal.title);
  const pendingGoalTitles = relevantGoals
    .filter((goal) => goal.status === "active")
    .map((goal) => goal.title);

  const formatList = (items) => (items.length ? items.join(", ") : "None");

  return {
    summaryDate,
    totalGoals: currentProgress.totalGoals,
    completedGoals: currentProgress.completedGoals,
    pendingGoals: currentProgress.pendingGoals,
    completionRate: currentProgress.completionRate,
    deliveryStatus: "preview",
    notificationMessage: [
      `Live midnight summary preview for ${userName || "Student"} on ${summaryDate}.`,
      `Completed tasks: ${formatList(completedGoalTitles)}.`,
      `Pending tasks remaining: ${formatList(pendingGoalTitles)}.`,
      `If you keep going at this pace, your completion rate will close at ${currentProgress.completionRate}%.`,
    ].join(" "),
  };
};

const GoalsSection = ({ userName }) => {
  const [goals, setGoals] = useState([]);
  const [latestSummary, setLatestSummary] = useState(null);
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [currentProgress, setCurrentProgress] = useState({
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    completionRate: 0,
  });
  const [form, setForm] = useState({
    title: "",
    deadlineDate: "",
    deadlineTime: "",
    emailEnabled: true,
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [xpTotal, setXpTotal] = useState(0);
  const [xpToast, setXpToast] = useState(null);
  const { day, fullDate } = useMemo(() => formatDayAndDate(), []);

  useEffect(() => {
    setXpTotal(getStoredXp(userName));
  }, [userName]);

  useEffect(() => {
    if (!xpToast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setXpToast(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [xpToast]);

  const loadGoals = async () => {
    try {
      const data = await getGoalsDashboard();
      setGoals(data.goals);
      setLatestSummary(data.latestSummary);
      setSummaryHistory(data.summaryHistory || []);
      setCurrentProgress(data.currentProgress);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const activeGoals = goals.filter((goal) => goal.status === "active");
  const completedGoals = goals.filter((goal) => goal.status === "completed");
  const today = new Date().toISOString().slice(0, 10);
  const overdueGoals = activeGoals.filter((goal) => goal.deadlineDate && goal.deadlineDate < today);
  const pieAngle = currentProgress.totalGoals
    ? Math.max(0, Math.min(360, (currentProgress.completedGoals / currentProgress.totalGoals) * 360))
    : 0;
  const currentLevel = Math.floor(xpTotal / 100) + 1;
  const xpIntoLevel = xpTotal % 100;
  const summaryPreview = useMemo(
    () =>
      buildLiveSummary({
        goals,
        currentProgress,
        summaryDate: today,
        userName,
      }),
    [currentProgress, goals, today, userName]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateGoal = async (event) => {
    event.preventDefault();

    try {
      const newGoal = await createGoal(form);
      setGoals((current) => [newGoal, ...current]);
      setForm({ title: "", deadlineDate: "", deadlineTime: "", emailEnabled: true });
      setStatus(
        newGoal.emailSent
          ? "THE EMAIL HAS BEEN SENT TO THE USER SUCCESSFULLY"
          : "Goal saved successfully."
      );
      await loadGoals();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleGoalAction = async (goalId, action, message) => {
    try {
      const currentGoal = goals.find((goal) => goal.id === goalId);
      await changeGoalState(goalId, action);
      if (action === "complete" && currentGoal?.status !== "completed") {
        const nextXp = addStoredXp(userName, 25);
        setXpTotal(nextXp);
        setXpToast({
          id: Date.now(),
          amount: 25,
        });
      }
      setStatus(message);
      await loadGoals();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleDeleteGoal = async (goal) => {
    const confirmed = window.confirm(`Delete goal "${goal.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteGoal(goal.id);
      setStatus("Goal deleted successfully.");
      await loadGoals();
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="section-stack">
      {xpToast ? (
        <div key={xpToast.id} className="xp-toast">
          +{xpToast.amount} XP
        </div>
      ) : null}

      {status ? <div className="status-banner">{status}</div> : null}

      <PageSection title={`GOOD MORNING, ${userName?.toUpperCase() || "STUDENT"}`} subtitle={`${day}, ${fullDate}`}>
        <div className="goals-greeting">
          <strong>BEST OF LUCK</strong>
          <p>Stay consistent today. Timed goals can email you 5 minutes before their deadline, and each day closes with a summary.</p>
        </div>
      </PageSection>

      <section className="progress-strip">
        <article className="progress-tile">
          <span>Total Tasks</span>
          <strong>{currentProgress.totalGoals}</strong>
        </article>
        <article className="progress-tile">
          <span>Completed</span>
          <strong>{currentProgress.completedGoals}</strong>
        </article>
        <article className="progress-tile">
          <span>Leftover</span>
          <strong>{currentProgress.pendingGoals}</strong>
        </article>
        <article className="progress-tile accent">
          <span>Completion Rate</span>
          <strong>{currentProgress.completionRate}%</strong>
        </article>
      </section>

      <div className="dashboard-grid split-layout goals-analytics-layout">
        <PageSection title="Goals Visualiser" subtitle="See your completed and pending goals as a live pie chart.">
          <div className="goals-visualiser">
            <div
              className="goal-pie-chart"
              style={{
                background: `conic-gradient(#22c55e 0deg ${pieAngle}deg, rgba(148, 163, 184, 0.18) ${pieAngle}deg 360deg)`,
              }}
            >
              <div className="goal-pie-core">
                <strong>{currentProgress.completionRate}%</strong>
                <span>done</span>
              </div>
            </div>

            <div className="goal-pie-legend">
              <div className="goal-legend-row">
                <span className="goal-legend-dot completed" />
                <small>Completed: {currentProgress.completedGoals}</small>
              </div>
              <div className="goal-legend-row">
                <span className="goal-legend-dot pending" />
                <small>Pending: {currentProgress.pendingGoals}</small>
              </div>
              <div className="goal-legend-row">
                <span className="goal-legend-dot total" />
                <small>Total: {currentProgress.totalGoals}</small>
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection title="Level Progress" subtitle="Every completed task gives 25 XP. Each level needs 100 XP.">
          <div className="level-panel">
            <div className="level-badge">Level {currentLevel}</div>
            <div className="focus-progress-shell">
              <span className="focus-progress-fill" style={{ width: `${xpIntoLevel}%` }} />
            </div>
            <div className="level-meta">
              <strong>{xpIntoLevel}/100 XP</strong>
              <small>Total XP: {xpTotal}</small>
            </div>
          </div>
        </PageSection>
      </div>

      {overdueGoals.length ? (
        <PageSection
          title="Deadline Check"
          subtitle="Some goals passed their deadline and are still pending."
        >
          <div className="goal-list">
            {overdueGoals.map((goal) => (
              <article key={goal.id} className="surface-subcard goal-card overdue">
                <div>
                  <h3>{goal.title}</h3>
                  <p>Deadline: {formatGoalDate(goal.deadlineDate, goal.deadlineTime)}</p>
                  <p className="prompt-line">Move to next day? Cancel goal?</p>
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => handleGoalAction(goal.id, "move_to_next_day", "Goal moved to the next day.")}
                  >
                    Move to Next Day
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => handleGoalAction(goal.id, "cancel", "Goal cancelled.")}
                  >
                    Cancel Goal
                  </button>
                </div>
              </article>
            ))}
          </div>
        </PageSection>
      ) : null}

      <div className="dashboard-grid split-layout">
        <PageSection title="Add Daily Goal" subtitle="You can optionally set a time to receive an email reminder 5 minutes before the goal is due.">
          <form className="form-grid" onSubmit={handleCreateGoal}>
            <label className="field field-wide">
              <span>Goal</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Revise database normalization notes"
                required
              />
            </label>

            <label className="field">
              <span>Deadline Date</span>
              <input type="date" name="deadlineDate" value={form.deadlineDate} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Deadline Time</span>
              <input type="time" name="deadlineTime" value={form.deadlineTime} onChange={handleChange} />
            </label>

            <label className="toggle-field field-wide">
              <input
                type="checkbox"
                name="emailEnabled"
                checked={form.emailEnabled}
                onChange={handleChange}
              />
              <span>Send an email reminder 5 minutes before this goal deadline</span>
            </label>

            <div className="button-row field-wide">
              <button type="submit" className="button-primary">
                Save Goal
              </button>
            </div>
          </form>
        </PageSection>

        <PageSection
          title="Midnight Summary"
          subtitle="This preview updates instantly as you complete goals. The final summary is then delivered and stored after midnight."
        >
          {summaryPreview.totalGoals ? (
            <div className="summary-card live">
              <p>
                <strong>{summaryPreview.summaryDate}</strong> · {getDeliveryLabel(summaryPreview.deliveryStatus)}
              </p>
              <p className="summary-highlight">
                {summaryPreview.completedGoals}/{summaryPreview.totalGoals} tasks completed · {summaryPreview.completionRate}% complete
              </p>
              <div className="summary-grid">
                <div className="summary-pill">
                  <span>Completed</span>
                  <strong>{summaryPreview.completedGoals}</strong>
                </div>
                <div className="summary-pill">
                  <span>Leftover</span>
                  <strong>{summaryPreview.pendingGoals}</strong>
                </div>
                <div className="summary-pill">
                  <span>Focus Score</span>
                  <strong>{summaryPreview.completionRate}%</strong>
                </div>
              </div>
              <p>{summaryPreview.notificationMessage}</p>
            </div>
          ) : (
            <div className="empty-state">Add goals to start building tonight&apos;s summary preview.</div>
          )}

          {latestSummary ? (
            <div className="summary-card archived">
              <p>
                <strong>Last Delivered Summary</strong>
              </p>
              <p>
                <strong>{latestSummary.summaryDate}</strong> · {getDeliveryLabel(latestSummary.deliveryStatus)}
              </p>
              <p className="summary-highlight">
                {latestSummary.completedGoals}/{latestSummary.totalGoals} tasks completed · {latestSummary.completionRate}% complete
              </p>
              <p>{latestSummary.notificationMessage}</p>
            </div>
          ) : null}
        </PageSection>
      </div>

      <PageSection title="Goal History" subtitle="Daily completed and leftover counts are stored here.">
        {summaryHistory.length ? (
          <div className="history-grid">
            {summaryHistory.map((summary) => (
              <article key={summary.id} className="surface-subcard history-card">
                <strong>{summary.summaryDate}</strong>
                <span>{summary.completionRate}% complete</span>
                <small>
                  Completed: {summary.completedGoals} · Leftover: {summary.pendingGoals}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No goal history has been recorded yet.</div>
        )}
      </PageSection>

      <PageSection title="Active Goals" subtitle="Use the checkbox to mark a goal as completed.">
        {loading ? (
          <div className="empty-state">Loading goals...</div>
        ) : activeGoals.length ? (
          <div className="goal-list">
            {activeGoals.map((goal) => (
              <article key={goal.id} className="surface-subcard goal-card">
                <label className="goal-check">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleGoalAction(goal.id, "complete", "Goal marked as completed.")}
                  />
                  <span>{goal.title}</span>
                </label>
                <div className="goal-meta">
                  <p>{formatGoalDate(goal.deadlineDate, goal.deadlineTime)}</p>
                  <small>Email alert: {goal.emailEnabled && goal.deadlineTime ? "Enabled" : "Disabled"}</small>
                </div>
                <div className="button-row compact">
                  <button type="button" className="button-danger" onClick={() => handleDeleteGoal(goal)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No active goals right now.</div>
        )}
      </PageSection>

      <PageSection title="Completed Goals" subtitle="Completed goals are separated automatically.">
        {completedGoals.length ? (
          <div className="goal-list">
            {completedGoals.map((goal) => (
              <article key={goal.id} className="surface-subcard goal-card completed">
                <label className="goal-check">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => handleGoalAction(goal.id, "reopen", "Goal moved back to active goals.")}
                  />
                  <span>{goal.title}</span>
                </label>
                <p>Completed · {goal.completedAt ? new Date(goal.completedAt).toLocaleString("en-IN") : "Recorded"}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No completed goals yet.</div>
        )}
      </PageSection>
    </div>
  );
};

export default GoalsSection;
