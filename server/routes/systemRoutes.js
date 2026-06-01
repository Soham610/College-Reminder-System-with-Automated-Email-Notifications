const express = require("express");
const { getEmailStatus } = require("../controllers/systemController");

const router = express.Router();

router.get("/email-diagnostics", getEmailStatus);

module.exports = router;
