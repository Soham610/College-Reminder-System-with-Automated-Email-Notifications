const SESSION_KEY = "collegeReminderSession";
const VISIT_KEY = "collegeReminderVisitCount";

const parseJwtPayload = (token) => {
  try {
    const [, payload] = String(token || "").split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = window.atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
};

export const isSessionExpired = (session) => {
  const payload = parseJwtPayload(session?.token);
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

export const getSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (session?.token && isSessionExpired(session)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch (_error) {
    return null;
  }
};

export const saveSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const incrementVisitCount = () => {
  const nextCount = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
  localStorage.setItem(VISIT_KEY, String(nextCount));
  return nextCount;
};

export const getVisitCount = () => Number(localStorage.getItem(VISIT_KEY) || "0");
