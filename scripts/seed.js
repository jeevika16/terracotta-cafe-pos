const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Load .env.local manually without needing extra packages
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        val = val.replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const MONGODB_URI = (process.env.MONGODB_URI || "mongodb://localhost:27017/cafe_billing_db")
  .trim()
  .replace(/^["']|["']$/g, "");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, default: 4 },
    section: { type: String, default: "Courtyard Terrace" },
    status: { type: String, default: "AVAILABLE" },
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    activeGuests: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    preparationTimeMinutes: { type: Number, default: 10 },
  },
  { timestamps: true }
);

const OrderSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tableNumber: { type: String, required: true },
    items: Array,
    status: { type: String, default: "COMPLETED" },
    paymentStatus: { type: String, default: "PAID" },
    paymentMethod: { type: String, default: "CASH" },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    placedByRole: { type: String, default: "ADMIN" },
  },
  { timestamps: true }
);

async function runSeed() {
  console.log("--------------------------------------------------");
  console.log("☕ Terracotta Cafe & POS Database Seeder");
  console.log("--------------------------------------------------");
  console.log("Target MongoDB URI:", MONGODB_URI.replace(/:([^@]+)@/, ":****@"));

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log("✓ Connected to MongoDB successfully!");
  } catch (err) {
    console.error("✗ Failed to connect to MongoDB:", err.message);
    console.log("\n[TIP] If you're running without a live MongoDB connection:");
    console.log("The application includes an automatic mock data store with pre-seeded users and menu!");
    console.log("You can also run a local MongoDB instance: mongodb://localhost:27017/cafe_billing_db");
    process.exit(1);
  }

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Table = mongoose.models.Table || mongoose.model("Table", TableSchema);
  const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
  const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

  // Clear existing
  await User.deleteMany({});
  await Table.deleteMany({});
  await MenuItem.deleteMany({});
  await Order.deleteMany({});
  console.log("✓ Cleared prior records.");

  // 1. Seed Users
  const adminPass = await bcrypt.hash("admin123", 10);
  const staffPass = await bcrypt.hash("staff123", 10);
  const chefPass = await bcrypt.hash("chef123", 10);

  const users = await User.create([
    {
      name: "Master Roaster & Admin",
      email: "admin@terracottacafe.com",
      password: adminPass,
      role: "ADMIN",
      active: true,
    },
    {
      name: "Barista Attendant",
      email: "staff@terracottacafe.com",
      password: staffPass,
      role: "EMPLOYEE",
      active: true,
    },
    {
      name: "Head Pastry Chef",
      email: "chef@terracottacafe.com",
      password: chefPass,
      role: "EMPLOYEE",
      active: true,
    },
  ]);
  console.log(`✓ Seeded ${users.length} Users with bcrypt passwords:`);
  console.log("   - Admin: admin@terracottacafe.com / admin123");
  console.log("   - Staff: staff@terracottacafe.com / staff123");
  console.log("   - Chef:  chef@terracottacafe.com / chef123");

  // 2. Seed Tables
  const tables = await Table.create([
    { tableNumber: "01", capacity: 2, section: "Courtyard Terrace", status: "AVAILABLE" },
    { tableNumber: "02", capacity: 2, section: "Courtyard Terrace", status: "AVAILABLE" },
    { tableNumber: "03", capacity: 4, section: "Courtyard Terrace", status: "AVAILABLE" },
    { tableNumber: "04", capacity: 4, section: "Main Roastery", status: "AVAILABLE" },
    { tableNumber: "05", capacity: 6, section: "Main Roastery", status: "AVAILABLE" },
    { tableNumber: "06", capacity: 8, section: "First Floor Lounge", status: "AVAILABLE" },
    { tableNumber: "07", capacity: 4, section: "First Floor Lounge", status: "AVAILABLE" },
    { tableNumber: "08", capacity: 2, section: "Window Bar", status: "AVAILABLE" },
  ]);
  console.log(`✓ Seeded ${tables.length} Dining Tables.`);

  // 3. Seed Menu Items
  const menuItems = await MenuItem.create([
    {
      name: "Terracotta Cortado",
      category: "Coffee",
      price: 220,
      costPrice: 50,
      description: "Equal parts espresso and silky textured milk served in an artisanal earthenware cup.",
      isAvailable: true,
      preparationTimeMinutes: 5,
    },
    {
      name: "Cold Drip Ethiopian Yirgacheffe",
      category: "Coffee",
      price: 280,
      costPrice: 70,
      description: "12-hour slow cold brew with floral citrus notes and brown sugar finish.",
      isAvailable: true,
      preparationTimeMinutes: 2,
    },
    {
      name: "Spiced Masala Chai Latte",
      category: "Tea & Beverages",
      price: 180,
      costPrice: 35,
      description: "CTC Assam black tea simmered with fresh cardamom, cinnamon, and oat milk.",
      isAvailable: true,
      preparationTimeMinutes: 6,
    },
    {
      name: "Matcha Ceremonial Cloud",
      category: "Tea & Beverages",
      price: 310,
      costPrice: 90,
      description: "Uji first-harvest ceremonial matcha whisked with Madagascar vanilla cream.",
      isAvailable: true,
      preparationTimeMinutes: 5,
    },
    {
      name: "Almond Frangipane Croissant",
      category: "Bakery & Desserts",
      price: 240,
      costPrice: 60,
      description: "Double baked buttery pastry filled with rich almond cream and toasted flakes.",
      isAvailable: true,
      preparationTimeMinutes: 3,
    },
    {
      name: "Burnt Basque Cheesecake",
      category: "Bakery & Desserts",
      price: 320,
      costPrice: 80,
      description: "Caramelized crust with a molten, velvety cream cheese center.",
      isAvailable: true,
      preparationTimeMinutes: 2,
    },
    {
      name: "Sourdough Avocado & Truffle Tartine",
      category: "Artisanal Mains",
      price: 390,
      costPrice: 110,
      description: "Handmade country sourdough, whipped Hass avocado, pickled shallots, white truffle oil.",
      isAvailable: true,
      preparationTimeMinutes: 12,
    },
    {
      name: "Smoked Chicken Pesto Panini",
      category: "Artisanal Mains",
      price: 420,
      costPrice: 130,
      description: "Wood-fired herb chicken, house basil pesto, bocconcini on toasted ciabatta.",
      isAvailable: true,
      preparationTimeMinutes: 14,
    },
    {
      name: "Truffle Parmesan Hand-cut Fries",
      category: "Sides & Quick Bites",
      price: 250,
      costPrice: 55,
      description: "Crispy skin-on potatoes dusted with 24-month aged parmesan and fresh herbs.",
      isAvailable: true,
      preparationTimeMinutes: 8,
    },
  ]);
  console.log(`✓ Seeded ${menuItems.length} Artisanal Menu Items.`);

  // 4. Seed Historical Orders
  const sampleOrders = [
    {
      tableId: tables[0]._id,
      tableNumber: "01",
      items: [
        { menuItemId: menuItems[0]._id, name: menuItems[0].name, price: 220, quantity: 2, subtotal: 440 },
        { menuItemId: menuItems[4]._id, name: menuItems[4].name, price: 240, quantity: 2, subtotal: 480 },
      ],
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      subtotal: 920,
      tax: 46,
      discount: 0,
      total: 966,
      placedByRole: "GUEST",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      tableId: tables[3]._id,
      tableNumber: "04",
      items: [
        { menuItemId: menuItems[1]._id, name: menuItems[1].name, price: 280, quantity: 1, subtotal: 280 },
        { menuItemId: menuItems[6]._id, name: menuItems[6].name, price: 390, quantity: 1, subtotal: 390 },
      ],
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod: "CARD",
      subtotal: 670,
      tax: 34,
      discount: 0,
      total: 704,
      placedByRole: "EMPLOYEE",
      createdAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      tableId: tables[4]._id,
      tableNumber: "05",
      items: [
        { menuItemId: menuItems[0]._id, name: menuItems[0].name, price: 220, quantity: 4, subtotal: 880 },
        { menuItemId: menuItems[7]._id, name: menuItems[7].name, price: 420, quantity: 2, subtotal: 840 },
        { menuItemId: menuItems[8]._id, name: menuItems[8].name, price: 250, quantity: 2, subtotal: 500 },
      ],
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod: "CASH",
      subtotal: 2220,
      tax: 111,
      discount: 0,
      total: 2331,
      placedByRole: "ADMIN",
      createdAt: new Date(),
    },
  ];

  await Order.insertMany(sampleOrders);
  console.log(`✓ Seeded ${sampleOrders.length} Completed Orders for accounts analytics.`);

  console.log("--------------------------------------------------");
  console.log("🎉 Database Seed Completed Successfully!");
  console.log("--------------------------------------------------");
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seed execution error:", err);
  process.exit(1);
});
