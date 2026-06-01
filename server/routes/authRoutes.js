const express = require("express");
const { signup, login, adminLogin, resetPassword } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.post("/reset-password", resetPassword);
router.post("/admin/reset-password", (req, res, next) => {
  req.body.role = "admin";
  next();
}, resetPassword);

module.exports = router;
