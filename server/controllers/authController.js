const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createUser,
  findUserByEmail,
  findUserByIdentifier,
  updateUserPasswordById,
} = require("../models/userModel");

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
    },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "8h" }
  );

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || "",
  createdAt: user.created_at,
});

const signup = async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ name, email, passwordHash, department, role: "student" });
  const token = signToken(user);

  return res.status(201).json({
    message: "Student account created successfully.",
    token,
    user: sanitizeUser(user),
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (user.role !== "student") {
    return res.status(403).json({ message: "Please use the admin login page for admin access." });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);

  return res.json({
    message: "Login successful.",
    token,
    user: sanitizeUser(user),
  });
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = findUserByEmail(email);
  if (!user || user.role !== "admin") {
    return res.status(401).json({ message: "Invalid admin credentials." });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid admin credentials." });
  }

  const token = signToken(user);

  return res.json({
    message: "Admin login successful.",
    token,
    user: sanitizeUser(user),
  });
};

const resetPassword = async (req, res) => {
  const { identifier, newPassword, confirmPassword, role } = req.body;
  const normalizedRole = role === "admin" ? "admin" : "student";

  if (!identifier || !newPassword || !confirmPassword) {
    return res.status(400).json({
      message: "Username or email, new password, and confirm password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters long." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New password and confirm password must match." });
  }

  const user = findUserByIdentifier({
    identifier,
    role: normalizedRole,
  });

  if (!user) {
    return res.status(404).json({
      message: `No ${normalizedRole} account matches that username or email.`,
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  updateUserPasswordById({
    id: user.id,
    passwordHash,
  });

  return res.json({
    message: `${normalizedRole === "admin" ? "Admin" : "Student"} password updated successfully.`,
  });
};

module.exports = {
  signup,
  login,
  adminLogin,
  resetPassword,
};
