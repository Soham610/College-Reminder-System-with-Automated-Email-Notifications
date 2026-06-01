const { findUserById } = require("../models/userModel");
const {
  getGoalsByUserId,
  getUsersWithGoals,
  goalSummaryExists,
  upsertGoalSummary,
} = require("../models/goalModel");
const { sendEmail } = require("./emailService");
const { addDays, getLocalDate } = require("../utils/date");

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const endOfDayUtc = (dateString) => new Date(`${addDays(dateString, 1)}T00:00:00.000Z`);

const buildGoalSnapshotForDate = ({ goals, summaryDate }) => {
  const cutoff = endOfDayUtc(summaryDate);

  const includedGoals = goals.filter((goal) => {
    const createdAt = parseTimestamp(goal.created_at);
    const updatedAt = parseTimestamp(goal.updated_at);

    if (!createdAt || createdAt >= cutoff) {
      return false;
    }

    if (goal.status === "cancelled" && updatedAt && updatedAt < cutoff) {
      return false;
    }

    return true;
  });

  const completedGoalTitles = includedGoals
    .filter((goal) => {
      const completedAt = parseTimestamp(goal.completed_at);
      return completedAt && completedAt < cutoff;
    })
    .map((goal) => goal.title);

  const pendingGoalTitles = includedGoals
    .filter((goal) => {
      const completedAt = parseTimestamp(goal.completed_at);
      return !completedAt || completedAt >= cutoff;
    })
    .map((goal) => goal.title);

  const completionRate = includedGoals.length
    ? Math.round((completedGoalTitles.length / includedGoals.length) * 100)
    : 0;

  return {
    allGoals: includedGoals.map((goal) => goal.title),
    completedGoalTitles,
    pendingGoalTitles,
    completionRate,
  };
};

const buildGoalSummaryMessage = ({
  userName,
  summaryDate,
  allGoals,
  completedGoalTitles,
  pendingGoalTitles,
  completionRate,
}) => {
  const formatList = (items) => (items.length ? items.join(", ") : "None");

  return [
    `Daily goal summary for ${userName} on ${summaryDate}.`,
    `Completion: ${completedGoalTitles.length}/${allGoals.length} tasks completed (${completionRate}%).`,
    `These were your goals: ${formatList(allGoals)}.`,
    `Completed tasks: ${formatList(completedGoalTitles)}.`,
    `Pending tasks remaining (${pendingGoalTitles.length}): ${formatList(pendingGoalTitles)}.`,
  ].join(" ");
};

const createGoalSummaryForUserAndDate = async (user, summaryDate) => {
  if (goalSummaryExists({ userId: user.id, summaryDate })) {
    return;
  }

  const goals = getGoalsByUserId(user.id);
  const snapshot = buildGoalSnapshotForDate({ goals, summaryDate });
  const notificationMessage = buildGoalSummaryMessage({
    userName: user.name,
    summaryDate,
    ...snapshot,
  });

  const emailResult = await sendEmail({
    to: user.email,
    subject: `Daily Goals Summary - ${summaryDate} (${snapshot.completionRate}% complete)`,
    text: notificationMessage,
    html: `
      <p><strong>Daily goal summary</strong> for ${user.name} on ${summaryDate}</p>
      <p><strong>Completion:</strong> ${snapshot.completedGoalTitles.length}/${snapshot.allGoals.length} (${snapshot.completionRate}%)</p>
      <p><strong>All goals:</strong> ${
        snapshot.allGoals.length ? snapshot.allGoals.join(", ") : "None"
      }</p>
      <p><strong>Completed tasks:</strong> ${
        snapshot.completedGoalTitles.length ? snapshot.completedGoalTitles.join(", ") : "None"
      }</p>
      <p><strong>Pending tasks remaining (${snapshot.pendingGoalTitles.length}):</strong> ${
        snapshot.pendingGoalTitles.length ? snapshot.pendingGoalTitles.join(", ") : "None"
      }</p>
    `,
  });

  const deliveryStatus = emailResult.sent ? "sent" : "simulated";

  upsertGoalSummary({
    userId: user.id,
    summaryDate,
    totalGoals: snapshot.allGoals.length,
    completedGoals: snapshot.completedGoalTitles.length,
    pendingGoals: snapshot.pendingGoalTitles.length,
    completionRate: snapshot.completionRate,
    allGoals: snapshot.allGoals,
    completedGoalTitles: snapshot.completedGoalTitles,
    pendingGoalTitles: snapshot.pendingGoalTitles,
    notificationMessage: emailResult.sent
      ? notificationMessage
      : `${notificationMessage} Delivery note: Saved to your dashboard because email delivery was unavailable at that time.`,
    deliveryStatus,
  });

  if (!emailResult.sent) {
    console.log(`[Goal Summary][Simulated][${user.email}] ${notificationMessage}`);
  }
};

const ensureDailyGoalSummaryForUser = async (userLike) => {
  const user = userLike.email ? userLike : findUserById(userLike.id);

  if (!user) {
    return;
  }

  const summaryDate = addDays(getLocalDate(), -1);
  await createGoalSummaryForUserAndDate(user, summaryDate);
};

let summaryWorker = null;

const startGoalSummaryWorker = () => {
  if (summaryWorker) {
    return;
  }

  const run = async () => {
    const summaryDate = addDays(getLocalDate(), -1);
    const users = getUsersWithGoals();

    for (const user of users) {
      await createGoalSummaryForUserAndDate(user, summaryDate);
    }
  };

  summaryWorker = setInterval(() => {
    run().catch((error) => {
      console.error("Goal summary worker failed:", error);
    });
  }, 60 * 1000);

  run().catch((error) => {
    console.error("Goal summary worker failed:", error);
  });
};

module.exports = {
  ensureDailyGoalSummaryForUser,
  startGoalSummaryWorker,
};
