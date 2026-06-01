import { request } from "./api";

const mapGoal = (goal) => ({
  id: goal.id,
  userId: goal.user_id ?? goal.userId,
  title: goal.title,
  deadlineDate: goal.deadline_date ?? goal.deadlineDate ?? "",
  deadlineTime: goal.deadline_time ?? goal.deadlineTime ?? "",
  status: goal.status,
  emailEnabled: Boolean(goal.email_enabled ?? goal.emailEnabled ?? true),
  completedAt: goal.completed_at ?? goal.completedAt ?? null,
  createdAt: goal.created_at ?? goal.createdAt,
  updatedAt: goal.updated_at ?? goal.updatedAt,
  emailSent: Boolean(goal.emailSent ?? goal.email_sent ?? false),
});

const sanitizeSummaryMessage = (message = "") =>
  message
    .replace(/Delivery simulated:[\s\S]*$/i, "Saved to your dashboard when email delivery was unavailable.")
    .replace(/Replace SMTP_[A-Z_,\s]+in server\/\.env to enable email reminders\.?/gi, "")
    .replace(/SMTP still uses example placeholder values\.?/gi, "")
    .replace(/SMTP connection failed:[^.]*\.?/gi, "Email delivery was unavailable.")
    .replace(/\s{2,}/g, " ")
    .trim();

const mapSummary = (summary) => {
  if (!summary) {
    return null;
  }

  return {
    id: summary.id,
    summaryDate: summary.summaryDate ?? summary.summary_date,
    totalGoals: summary.totalGoals ?? summary.total_goals ?? 0,
    completedGoals: summary.completedGoals ?? summary.completed_goals ?? 0,
    pendingGoals: summary.pendingGoals ?? summary.pending_goals ?? 0,
    completionRate: summary.completionRate ?? summary.completion_rate ?? 0,
    allGoals: summary.allGoals || [],
    completedGoalTitles: summary.completedGoalTitles || [],
    pendingGoalTitles: summary.pendingGoalTitles || [],
    notificationMessage: sanitizeSummaryMessage(summary.notificationMessage || ""),
    deliveryStatus: summary.deliveryStatus || "simulated",
    createdAt: summary.createdAt ?? summary.created_at,
  };
};

export const getGoalsDashboard = async () => {
  const data = await request("/goals");

  return {
    goals: (data.goals || []).map(mapGoal),
    latestSummary: mapSummary(data.latestSummary),
    summaryHistory: (data.summaryHistory || []).map(mapSummary),
    currentProgress: {
      totalGoals: data.currentProgress?.totalGoals ?? 0,
      completedGoals: data.currentProgress?.completedGoals ?? 0,
      pendingGoals: data.currentProgress?.pendingGoals ?? 0,
      completionRate: data.currentProgress?.completionRate ?? 0,
    },
  };
};

export const createGoal = async (payload) => {
  const goal = await request("/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return mapGoal(goal);
};

export const updateGoal = async (id, payload) => {
  const goal = await request(`/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return mapGoal(goal);
};

export const changeGoalState = async (id, action) => {
  const goal = await request(`/goals/${id}/state`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });

  return mapGoal(goal);
};

export const deleteGoal = (id) =>
  request(`/goals/${id}`, {
    method: "DELETE",
  });
