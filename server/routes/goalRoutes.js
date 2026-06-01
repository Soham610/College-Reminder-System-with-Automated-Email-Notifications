const express = require("express");
const {
  listGoals,
  addGoal,
  editGoal,
  changeGoalState,
  removeGoal,
  listOverdueGoals,
} = require("../controllers/goalController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.get("/", listGoals);
router.get("/overdue", listOverdueGoals);
router.post("/", addGoal);
router.put("/:id", editGoal);
router.patch("/:id/state", changeGoalState);
router.delete("/:id", removeGoal);

module.exports = router;
