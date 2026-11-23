const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, default: 4 },
    section: { type: String, default: "Main Area" },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "BILLING"],
      default: "AVAILABLE",
    },
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    activeGuests: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Table || mongoose.model("Table", TableSchema);
