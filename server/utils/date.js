const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
const weekdayFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: APP_TIMEZONE,
  weekday: "long",
});

const localDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const localDateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const toUtcDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const getLocalDate = (date = new Date()) => localDateFormatter.format(date);

const getLocalTimestamp = (date = new Date()) => localDateTimeFormatter.format(date).replace(" ", "T");

const getLocalWeekday = (date = new Date()) => weekdayFormatter.format(date);

const addDays = (dateString, days) => {
  const date = toUtcDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const isBeforeDate = (left, right) => toUtcDate(left).getTime() < toUtcDate(right).getTime();

const getTimezoneOffsetString = () => {
  if (APP_TIMEZONE === "Asia/Kolkata") {
    return "+05:30";
  }

  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
};

const buildLocalDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) {
    return null;
  }

  const date = new Date(`${dateString}T${timeString}:00${getTimezoneOffsetString()}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

module.exports = {
  APP_TIMEZONE,
  addDays,
  buildLocalDateTime,
  getLocalDate,
  getLocalTimestamp,
  getLocalWeekday,
  getTimezoneOffsetString,
  isBeforeDate,
};
