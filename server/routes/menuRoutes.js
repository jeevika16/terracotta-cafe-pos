const express = require("express");
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");

router.get("/", getMenuItems);
router.post("/", createMenuItem);
router.put("/", updateMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);
router.delete("/", deleteMenuItem);

module.exports = router;
