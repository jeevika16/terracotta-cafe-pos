const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Coffee", "Tea & Beverages", "Bakery & Desserts", "Artisanal Mains", "Sides & Quick Bites"],
    },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true, default: 0 },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    preparationTimeMinutes: { type: Number, default: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
