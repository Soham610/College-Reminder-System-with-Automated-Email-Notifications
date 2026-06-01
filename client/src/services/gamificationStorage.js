const getKey = (userName = "student") => `collegeReminderXp:${String(userName).toLowerCase()}`;

export const getStoredXp = (userName) => {
  try {
    const value = Number(window.localStorage.getItem(getKey(userName)) || "0");
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (_error) {
    return 0;
  }
};

export const addStoredXp = (userName, amount) => {
  const current = getStoredXp(userName);
  const next = current + amount;
  window.localStorage.setItem(getKey(userName), String(next));
  return next;
};
