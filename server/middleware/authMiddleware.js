const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token is missing." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Authentication token is invalid or expired." });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "You do not have permission to perform this action." });
  }

  return next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
