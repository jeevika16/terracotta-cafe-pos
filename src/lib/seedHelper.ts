import bcrypt from "bcryptjs";
import User from "@/models/User";
import Table from "@/models/Table";
import MenuItem from "@/models/MenuItem";
import Order from "@/models/Order";

export const SAMPLE_USERS = [
  {
    name: "Master Roaster & Admin",
    email: "admin@terracottacafe.com",
    password: "admin123",
    role: "ADMIN",
    active: true,
  },
  {
    name: "Barista Attendant",
    email: "staff@terracottacafe.com",
    password: "staff123",
    role: "EMPLOYEE",
    active: true,
  },
  {
    name: "Head Pastry Chef",
    email: "chef@terracottacafe.com",
    password: "chef123",
    role: "EMPLOYEE",
    active: true,
  },
];

export const SAMPLE_TABLES = [
  { tableNumber: "01", capacity: 2, section: "Courtyard Terrace", status: "AVAILABLE" },
  { tableNumber: "02", capacity: 2, section: "Courtyard Terrace", status: "AVAILABLE" },
  { tableNumber: "03", capacity: 4, section: "Courtyard Terrace", status: "AVAILABLE" },
  { tableNumber: "04", capacity: 4, section: "Main Roastery", status: "AVAILABLE" },
  { tableNumber: "05", capacity: 6, section: "Main Roastery", status: "AVAILABLE" },
  { tableNumber: "06", capacity: 8, section: "First Floor Lounge", status: "AVAILABLE" },
  { tableNumber: "07", capacity: 4, section: "First Floor Lounge", status: "AVAILABLE" },
  { tableNumber: "08", capacity: 2, section: "Window Bar", status: "AVAILABLE" },
];

export const SAMPLE_MENU = [
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
];

export async function seedMongoDatabase(cleanFirst: boolean = false) {
  if (cleanFirst) {
    await User.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
  }

  // 1. Users
  let usersCreated = 0;
  for (const u of SAMPLE_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        active: u.active,
      });
      usersCreated++;
    }
  }

  // 2. Tables
  let tablesCreated = 0;
  const existingTableCount = await Table.countDocuments();
  if (existingTableCount === 0) {
    await Table.insertMany(SAMPLE_TABLES);
    tablesCreated = SAMPLE_TABLES.length;
  }

  // 3. Menu Items
  let menuCreated = 0;
  const existingMenuCount = await MenuItem.countDocuments();
  if (existingMenuCount === 0) {
    await MenuItem.insertMany(SAMPLE_MENU);
    menuCreated = SAMPLE_MENU.length;
  }

  // 4. Sample Orders
  let ordersCreated = 0;
  const existingOrderCount = await Order.countDocuments();
  if (existingOrderCount === 0) {
    const dbTables = await Table.find().limit(3);
    const dbMenu = await MenuItem.find().limit(5);

    if (dbTables.length > 0 && dbMenu.length > 0) {
      const sampleOrders = [
        {
          tableId: dbTables[0]._id,
          tableNumber: dbTables[0].tableNumber,
          items: [
            { menuItemId: dbMenu[0]._id, name: dbMenu[0].name, price: dbMenu[0].price, costPrice: dbMenu[0].costPrice, quantity: 2, subtotal: dbMenu[0].price * 2 },
            { menuItemId: dbMenu[1]._id, name: dbMenu[1].name, price: dbMenu[1].price, costPrice: dbMenu[1].costPrice, quantity: 1, subtotal: dbMenu[1].price },
          ],
          status: "COMPLETED",
          paymentStatus: "PAID",
          paymentMethod: "UPI",
          subtotal: dbMenu[0].price * 2 + dbMenu[1].price,
          tax: 35,
          discount: 0,
          total: dbMenu[0].price * 2 + dbMenu[1].price + 35,
          placedByRole: "GUEST",
          createdAt: new Date(Date.now() - 86400000 * 2),
        },
        {
          tableId: dbTables[1]._id,
          tableNumber: dbTables[1].tableNumber,
          items: [
            { menuItemId: dbMenu[2]._id, name: dbMenu[2].name, price: dbMenu[2].price, costPrice: dbMenu[2].costPrice, quantity: 2, subtotal: dbMenu[2].price * 2 },
          ],
          status: "COMPLETED",
          paymentStatus: "PAID",
          paymentMethod: "CARD",
          subtotal: dbMenu[2].price * 2,
          tax: 18,
          discount: 0,
          total: dbMenu[2].price * 2 + 18,
          placedByRole: "EMPLOYEE",
          createdAt: new Date(Date.now() - 86400000),
        },
      ];

      await Order.insertMany(sampleOrders);
      ordersCreated = sampleOrders.length;
    }
  }

  return {
    usersCreated,
    tablesCreated,
    menuCreated,
    ordersCreated,
  };
}
