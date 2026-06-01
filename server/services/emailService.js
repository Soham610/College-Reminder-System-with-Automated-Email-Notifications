let transporter = null;
let lastEmailError = "";

const getSmtpValue = (key) => String(process.env[key] || "").trim();
const getNormalizedSmtpPass = () => getSmtpValue("SMTP_PASS").replace(/\s+/g, "");

const placeholderValues = new Set([
  "your-email@example.com",
  "your-app-password",
  "College Reminder System <your-email@example.com>",
  "your-real-email@gmail.com",
  "your-16-character-app-password",
  "College Reminder System <your-real-email@gmail.com>",
]);

const loadNodemailer = () => {
  try {
    return require("nodemailer");
  } catch (_error) {
    return null;
  }
};

const getEmailDiagnostics = () => {
  const nodemailer = loadNodemailer();

  if (!nodemailer) {
    return {
      ready: false,
      message: "Email delivery is unavailable because the mail service dependency is missing.",
    };
  }

  const requiredValues = [
    getSmtpValue("SMTP_HOST"),
    getSmtpValue("SMTP_PORT"),
    getSmtpValue("SMTP_USER"),
    getNormalizedSmtpPass(),
    getSmtpValue("SMTP_FROM"),
  ];

  if (requiredValues.some((value) => !value)) {
    return {
      ready: false,
      message: "Email delivery is not configured yet. Reminders will stay available inside your dashboard.",
    };
  }

  if (
    placeholderValues.has(getSmtpValue("SMTP_USER")) ||
    placeholderValues.has(getSmtpValue("SMTP_PASS")) ||
    placeholderValues.has(getSmtpValue("SMTP_FROM"))
  ) {
    return {
      ready: false,
      message: "Email delivery is still using example mail settings, so reminders stay inside the app for now.",
    };
  }

  if (lastEmailError) {
    return {
      ready: false,
      message: "Email delivery is temporarily unavailable. Your reminders and summaries are still saved in the dashboard.",
    };
  }

  return {
    ready: true,
    message: "SMTP mailer is configured.",
  };
};

const getTransporter = () => {
  const diagnostics = getEmailDiagnostics();
  if (!diagnostics.ready) {
    return null;
  }

  if (!transporter) {
    const nodemailer = loadNodemailer();
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(getSmtpValue("SMTP_PORT") || 587),
      secure: getSmtpValue("SMTP_SECURE") === "true",
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: getSmtpValue("SMTP_USER"),
        pass: getNormalizedSmtpPass(),
      },
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();

  if (!mailer) {
    return { sent: false, reason: getEmailDiagnostics().message };
  }

  try {
    await mailer.sendMail({
      from: getSmtpValue("SMTP_FROM"),
      to,
      subject,
      html,
      text,
    });
    lastEmailError = "";
  } catch (error) {
    lastEmailError = error.message;
    transporter = null;
    return {
      sent: false,
      reason: error.message,
    };
  }

  return { sent: true };
};

const sendReminderEmail = (payload) => sendEmail(payload);

module.exports = {
  getEmailDiagnostics,
  sendEmail,
  sendReminderEmail,
};
