const { getEmailDiagnostics } = require("../services/emailService");

const getEmailStatus = (_req, res) => {
  return res.json(getEmailDiagnostics());
};

module.exports = {
  getEmailStatus,
};
