const {
  validateGoalInput,
  getGoalsByUserId,
  createGoal,
  updateGoalById,
  deleteGoalById,
  getLatestGoalSummaryByUserId,
  getGoalSummariesByUserId,
} = require("../models/goalModel");
const { addDays, getLocalDate, isBeforeDate } = require("../utils/date");
const { ensureDailyGoalSummaryForUser } = require("../services/goalSummaryService");
const { attemptImmediateGoalNotification } = require("../services/reminderNotificationService");

const serializeGoalPayload = (goal) => ({
  id: goal.id,
  user_id: goal.user_id,
  title: goal.title,
  deadline_date: goal.deadline_date,
  deadline_time: goal.deadline_time,
  status: goal.status,
  email_enabled: Boolean(goal.email_enabled ?? true),
  completed_at: goal.completed_at,
  created_at: goal.created_at,
  updated_at: goal.updated_at,
});

const parseSummary = (summary) => {
  if (!summary) {
    return null;
  }

  const parseJson = (value) => {
    try {
      return JSON.parse(value || "[]");
    } catch (_error) {
      return [];
    }
  };

  return {
    id: summary.id,
    summaryDate: summary.summary_date,
    totalGoals: summary.total_goals,
    completedGoals: summary.completed_goals,
    pendingGoals: summary.pending_goals,
    completionRate: Number(summary.completion_rate || 0),
    allGoals: parseJson(summary.all_goals_json),
    completedGoalTitles: parseJson(summary.completed_goals_json),
    pendingGoalTitles: parseJson(summary.pending_goals_json),
    notificationMessage: summary.notification_message || "",
    deliveryStatus: summary.delivery_status,
    createdAt: summary.created_at,
  };
};

const buildCurrentProgress = (goals) => {
  const relevantGoals = goals.filter((goal) => goal.status !== "cancelled");
  const completedGoals = relevantGoals.filter((goal) => goal.status === "completed").length;
  const pendingGoals = relevantGoals.filter((goal) => goal.status === "active").length;
  const totalGoals = relevantGoals.length;
  const completionRate = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return {
    totalGoals,
    completedGoals,
    pendingGoals,
    completionRate,
  };
};

const listGoals = async (req, res, next) => {
  try {
    await ensureDailyGoalSummaryForUser(req.user);
    const rawGoals = getGoalsByUserId(req.user.id);

    return res.json({
      goals: rawGoals.map(serializeGoalPayload),
      latestSummary: parseSummary(getLatestGoalSummaryByUserId(req.user.id)),
      summaryHistory: getGoalSummariesByUserId(req.user.id).map(parseSummary),
      currentProgress: buildCurrentProgress(rawGoals),
    });
  } catch (error) {
    return next(error);
  }
};

const addGoal = async (req, res, next) => {
  const { error, value } = validateGoalInput(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const goal = createGoal({ userId: req.user.id, goal: value });
    const emailResult =
      goal.email_enabled && goal.deadline_time
        ? await attemptImmediateGoalNotification({
            goal,
            ownerEmail: req.user.email,
          })
        : { sent: false };

    return res.status(201).json({
      ...serializeGoalPayload(goal),
      emailSent: Boolean(emailResult.sent),
    });
  } catch (error) {
    return next(error);
  }
};

const editGoal = (req, res) => {
  const { title, deadlineDate, deadlineTime, emailEnabled } = req.body;

  const updatedGoal = updateGoalById({
    id: req.params.id,
    userId: req.user.id,
    changes: {
      title,
      deadlineDate,
      deadlineTime,
      emailEnabled,
    },
  });

  if (updatedGoal === null) {
    return res.status(404).json({ message: "Goal not found." });
  }

  if (updatedGoal === false) {
    return res.status(403).json({ message: "You can only edit your own goals." });
  }

  if (updatedGoal.error) {
    return res.status(400).json({ message: updatedGoal.error });
  }

  return res.json(serializeGoalPayload(updatedGoal));
};

const changeGoalState = (req, res) => {
  const action = String(req.body.action || "").trim().toLowerCase();
  const today = getLocalDate();

  const changesByAction = {
    complete: {
      status: "completed",
      completedAt: new Date().toISOString(),
    },
    reopen: {
      status: "active",
      completedAt: null,
    },
    cancel: {
      status: "cancelled",
      completedAt: null,
    },
    move_to_next_day: {
      status: "active",
      deadlineDate: addDays(today, 1),
      completedAt: null,
    },
  };

  const changes = changesByAction[action];

  if (!changes) {
    return res.status(400).json({ message: "Goal action is invalid." });
  }

  const updatedGoal = updateGoalById({
    id: req.params.id,
    userId: req.user.id,
    changes,
  });

  if (updatedGoal === null) {
    return res.status(404).json({ message: "Goal not found." });
  }

  if (updatedGoal === false) {
    return res.status(403).json({ message: "You can only update your own goals." });
  }

  if (updatedGoal.error) {
    return res.status(400).json({ message: updatedGoal.error });
  }

  return res.json(serializeGoalPayload(updatedGoal));
};

const removeGoal = (req, res) => {
  const deleted = deleteGoalById({ id: req.params.id, userId: req.user.id });

  if (deleted === null) {
    return res.status(404).json({ message: "Goal not found." });
  }

  if (deleted === false) {
    return res.status(403).json({ message: "You can only delete your own goals." });
  }

  return res.json({ message: "Goal deleted successfully." });
};

const listOverdueGoals = (req, res) => {
  const today = getLocalDate();
  const goals = getGoalsByUserId(req.user.id)
    .filter(
      (goal) =>
        goal.status === "active" &&
        goal.deadline_date &&
        isBeforeDate(goal.deadline_date, today)
    )
    .map(serializeGoalPayload);

  return res.json(goals);
};

module.exports = {
  listGoals,
  addGoal,
  editGoal,
  changeGoalState,
  removeGoal,
  listOverdueGoals,
};
