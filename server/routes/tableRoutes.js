const express = require("express");
const router = express.Router();
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");

router.get("/", getTables);
router.post("/", createTable);
router.patch("/", updateTable);
router.delete("/:id", deleteTable);
router.delete("/", deleteTable);

module.exports = router;
