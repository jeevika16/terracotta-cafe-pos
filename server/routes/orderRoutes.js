const express = require("express");
const router = express.Router();
const {
  getOrders,
  createOrder,
  patchOrder,
} = require("../controllers/orderController");

router.get("/", getOrders);
router.post("/", createOrder);
router.patch("/", patchOrder);

module.exports = router;
