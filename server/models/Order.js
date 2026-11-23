const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
  notes: { type: String, default: "" },
});

const OrderSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    tableNumber: { type: String, required: true },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ["PENDING", "PREPARING", "SERVED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "SPLIT"],
      default: "CASH",
    },
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    placedByRole: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE", "GUEST"],
      default: "GUEST",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
