import { Schema, model, models } from "mongoose";

const TableSchema = new Schema(
  {
    tableNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, default: 4 },
    section: { type: String, default: "Courtyard Terrace" },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "BILLING"],
      default: "AVAILABLE",
    },
    currentOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    activeGuests: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Table || model("Table", TableSchema);
