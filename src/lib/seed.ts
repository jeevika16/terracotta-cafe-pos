import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cafe_billing_db";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  active: Boolean,
});

const TableSchema = new mongoose.Schema({
  tableNumber: String,
  capacity: Number,
  section: String,
  status: String,
  currentOrderId: mongoose.Schema.Types.ObjectId,
});

const MenuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  costPrice: Number,
  description: String,
  isAvailable: Boolean,
  preparationTimeMinutes: Number,
});

const OrderSchema = new mongoose.Schema({
  tableId: mongoose.Schema.Types.ObjectId,
  tableNumber: String,
  items: Array,
  status: String,
  paymentStatus: String,
  paymentMethod: String,
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  placedByRole: String,
  createdAt: { type: Date, default: Date.now },
});

export async function seed() {
  console.log("Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Table = mongoose.models.Table || mongoose.model("Table", TableSchema);
  const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
  const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

  // Clear existing
  await User.deleteMany({});
  await Table.deleteMany({});
  await MenuItem.deleteMany({});
  await Order.deleteMany({});

  console.log("Cleared old records. Seeding Terracotta Cafe data...");

  // 1. Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  const admin = await User.create({
    name: "Master Roaster & Admin",
    email: "admin@terracottacafe.com",
    password: adminPassword,
    role: "ADMIN",
    active: true,
  });

  const staff = await User.create({
    name: "Barista Attendant",
    email: "staff@terracottacafe.com",
    password: staffPassword,
    role: "EMPLOYEE",
    active: true,
  });

  console.log("Created users: Admin & Employee");

  // 2. Tables
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

  console.log(`Created ${tables.length} tables`);

  // 3. Menu Items
  const menuItems = await MenuItem.create([
    {
      name: "Terracotta Cortado",
      category: "Coffee",
      price: 220,
      costPrice: 50,
      description: "Equal parts espresso and textured milk served in a rustic earthenware cup.",
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

  console.log(`Created ${menuItems.length} menu items`);

  // 4. Sample Completed Orders for immediate accounts dashboard visualization
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
  console.log("Seeded sample completed orders with historical financial records.");

  console.log("Seed complete! You can start the dev server now.");
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}
