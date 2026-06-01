const { db } = require("./db");

const allowedStatuses = new Set(["active", "completed", "cancelled"]);

const normalizeGoalInput = (payload) => ({
  title: String(payload.title || "").trim(),
  deadlineDate: String(payload.deadlineDate || payload.deadline_date || "").trim(),
  deadlineTime: String(payload.deadlineTime || payload.deadline_time || "").trim(),
  emailEnabled:
    payload.emailEnabled === undefined || payload.emailEnabled === null
      ? 1
      : payload.emailEnabled
        ? 1
        : 0,
});

const validateGoalInput = (payload) => {
  const goal = normalizeGoalInput(payload);

  if (!goal.title) {
    return { error: "Goal text is required." };
  }

  if (goal.deadlineTime && !goal.deadlineDate) {
    return { error: "Please choose a deadline date when adding a reminder time for a goal." };
  }

  return { value: goal };
};

const getGoalById = (id) =>
  db
    .prepare(
      `
        SELECT *
        FROM goals
        WHERE id = ?
      `
    )
    .get(id);

const getGoalsByUserId = (userId) =>
  db
    .prepare(
      `
        SELECT *
        FROM goals
        WHERE user_id = ?
        ORDER BY
          CASE status
            WHEN 'active' THEN 1
            WHEN 'completed' THEN 2
            ELSE 3
          END,
          CASE WHEN deadline_date IS NULL THEN 1 ELSE 0 END,
          deadline_date ASC,
          created_at DESC
      `
    )
    .all(userId);

const createGoal = ({ userId, goal }) => {
  const result = db
    .prepare(
      `
        INSERT INTO goals (user_id, title, deadline_date, deadline_time, email_enabled)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(
      userId,
      goal.title,
      goal.deadlineDate || null,
      goal.deadlineTime || null,
      goal.emailEnabled
    );

  return getGoalById(result.lastInsertRowid);
};

const updateGoalById = ({ id, userId, changes }) => {
  const existing = getGoalById(id);

  if (!existing) {
    return null;
  }

  if (Number(existing.user_id) !== Number(userId)) {
    return false;
  }

  const nextTitle =
    changes.title === undefined ? existing.title : String(changes.title || "").trim();
  const nextDeadline =
    changes.deadlineDate === undefined
      ? existing.deadline_date
      : String(changes.deadlineDate || "").trim() || null;
  const nextDeadlineTime =
    changes.deadlineTime === undefined
      ? existing.deadline_time
      : String(changes.deadlineTime || "").trim() || null;
  const nextStatus =
    changes.status === undefined
      ? existing.status
      : String(changes.status || "").trim().toLowerCase();
  const nextEmailEnabled =
    changes.emailEnabled === undefined
      ? existing.email_enabled
      : changes.emailEnabled
        ? 1
        : 0;

  if (!nextTitle) {
    return { error: "Goal text is required." };
  }

  if (nextDeadlineTime && !nextDeadline) {
    return { error: "Please choose a deadline date when adding a reminder time for a goal." };
  }

  if (!allowedStatuses.has(nextStatus)) {
    return { error: "Goal status is invalid." };
  }

  const completedAt =
    nextStatus === "completed"
      ? changes.completedAt || existing.completed_at || new Date().toISOString()
      : null;

  db.prepare(
    `
      UPDATE goals
      SET
        title = ?,
        deadline_date = ?,
        deadline_time = ?,
        status = ?,
        email_enabled = ?,
        notification_last_sent_for = NULL,
        completed_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
  ).run(nextTitle, nextDeadline, nextDeadlineTime, nextStatus, nextEmailEnabled, completedAt, id);

  return getGoalById(id);
};

const deleteGoalById = ({ id, userId }) => {
  const existing = getGoalById(id);

  if (!existing) {
    return null;
  }

  if (Number(existing.user_id) !== Number(userId)) {
    return false;
  }

  return db.prepare("DELETE FROM goals WHERE id = ?").run(id);
};

const getLatestGoalSummaryByUserId = (userId) =>
  db
    .prepare(
      `
        SELECT *
        FROM goal_daily_summaries
        WHERE user_id = ?
        ORDER BY summary_date DESC
        LIMIT 1
      `
    )
    .get(userId);

const getGoalSummariesByUserId = (userId, limit = 7) =>
  db
    .prepare(
      `
        SELECT *
        FROM goal_daily_summaries
        WHERE user_id = ?
        ORDER BY summary_date DESC
        LIMIT ?
      `
    )
    .all(userId, limit);

const goalSummaryExists = ({ userId, summaryDate }) =>
  db
    .prepare(
      `
        SELECT id
        FROM goal_daily_summaries
        WHERE user_id = ? AND summary_date = ?
        LIMIT 1
      `
    )
    .get(userId, summaryDate);

const upsertGoalSummary = ({
  userId,
  summaryDate,
  totalGoals,
  completedGoals,
  pendingGoals,
  completionRate,
  allGoals,
  completedGoalTitles,
  pendingGoalTitles,
  notificationMessage,
  deliveryStatus,
}) =>
  db
    .prepare(
      `
        INSERT INTO goal_daily_summaries (
          user_id,
          summary_date,
          total_goals,
          completed_goals,
          pending_goals,
          completion_rate,
          all_goals_json,
          completed_goals_json,
          pending_goals_json,
          notification_message,
          delivery_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, summary_date) DO UPDATE SET
          total_goals = excluded.total_goals,
          completed_goals = excluded.completed_goals,
          pending_goals = excluded.pending_goals,
          completion_rate = excluded.completion_rate,
          all_goals_json = excluded.all_goals_json,
          completed_goals_json = excluded.completed_goals_json,
          pending_goals_json = excluded.pending_goals_json,
          notification_message = excluded.notification_message,
          delivery_status = excluded.delivery_status
      `
    )
    .run(
      userId,
      summaryDate,
      totalGoals,
      completedGoals,
      pendingGoals,
      completionRate,
      JSON.stringify(allGoals),
      JSON.stringify(completedGoalTitles),
      JSON.stringify(pendingGoalTitles),
      notificationMessage,
      deliveryStatus
    );

const getTimedGoalsForNotification = () =>
  db
    .prepare(
      `
        SELECT
          goals.*,
          users.name AS owner_name,
          users.email AS owner_email
        FROM goals
        JOIN users ON users.id = goals.user_id
        WHERE goals.status = 'active'
          AND goals.email_enabled = 1
          AND goals.deadline_date IS NOT NULL
          AND goals.deadline_time IS NOT NULL
          AND TRIM(goals.deadline_time) <> ''
      `
    )
    .all();

const markGoalNotificationSent = ({ goalId, occurrenceKey }) =>
  db
    .prepare(
      `
        UPDATE goals
        SET notification_last_sent_for = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
    .run(occurrenceKey, goalId);

const getUsersWithGoals = () =>
  db
    .prepare(
      `
        SELECT DISTINCT users.id, users.name, users.email
        FROM users
        JOIN goals ON goals.user_id = users.id
        WHERE users.role = 'student'
      `
    )
    .all();

module.exports = {
  validateGoalInput,
  getGoalsByUserId,
  createGoal,
  updateGoalById,
  deleteGoalById,
  getLatestGoalSummaryByUserId,
  getGoalSummariesByUserId,
  goalSummaryExists,
  upsertGoalSummary,
  getUsersWithGoals,
  getTimedGoalsForNotification,
  markGoalNotificationSent,
};
