import bcrypt from "bcryptjs";
import { ITable, IMenuItem, IOrder, UserRole, ISalesSummary, ISoldItemMetric, IDailySalesMetric } from "@/types";

export interface IMockUser {
  _id: string;
  name: string;
  email: string;
  password: string; // bcrypt hashed
  role: UserRole;
  active: boolean;
  createdAt: string;
}

// Global in-memory storage preserved across hot-reloads in Node runtime
declare global {
  var __cafeMockStore: {
    users: IMockUser[];
    tables: ITable[];
    menuItems: IMenuItem[];
    orders: IOrder[];
  } | undefined;
}

const initialUsers: IMockUser[] = [
  {
    _id: "usr_admin_001",
    name: "Master Roaster & Admin",
    email: "admin@terracottacafe.com",
    // hashed "admin123"
    password: "$2a$10$wczg1nnBu441YovqzzvQBuuXd5cGUgEM1NgA1GEtjWg1QuUr.SJmm",
    role: "ADMIN",
    active: true,
    createdAt: new Date("2026-01-01T08:00:00Z").toISOString(),
  },
  {
    _id: "usr_staff_002",
    name: "Barista Attendant",
    email: "staff@terracottacafe.com",
    // hashed "staff123"
    password: "$2a$10$U0/VWNxFQLbzWnWhmuKWSuDiJpU5cq2TrIuHmih44W2VcBDwHvN9m",
    role: "EMPLOYEE",
    active: true,
    createdAt: new Date("2026-01-05T09:30:00Z").toISOString(),
  },
  {
    _id: "usr_chef_003",
    name: "Head Pastry Chef",
    email: "chef@terracottacafe.com",
    // hashed "chef123"
    password: "$2a$10$jj3Adrg7oUDC4I7/ddaWX.SkOGWyS1SIOCx1EJsp35F8uIOAdQlQq",
    role: "EMPLOYEE",
    active: true,
    createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
  },
];

const initialTables: ITable[] = [
  { _id: "tbl_01", tableNumber: "01", capacity: 2, section: "Courtyard Terrace", status: "AVAILABLE", activeGuests: 0 },
  { _id: "tbl_02", tableNumber: "02", capacity: 2, section: "Courtyard Terrace", status: "OCCUPIED", activeGuests: 2, currentOrderId: "ord_active_001" },
  { _id: "tbl_03", tableNumber: "03", capacity: 4, section: "Courtyard Terrace", status: "AVAILABLE", activeGuests: 0 },
  { _id: "tbl_04", tableNumber: "04", capacity: 4, section: "Main Roastery", status: "AVAILABLE", activeGuests: 0 },
  { _id: "tbl_05", tableNumber: "05", capacity: 6, section: "Main Roastery", status: "RESERVED", activeGuests: 0 },
  { _id: "tbl_06", tableNumber: "06", capacity: 8, section: "First Floor Lounge", status: "AVAILABLE", activeGuests: 0 },
  { _id: "tbl_07", tableNumber: "07", capacity: 4, section: "First Floor Lounge", status: "AVAILABLE", activeGuests: 0 },
  { _id: "tbl_08", tableNumber: "08", capacity: 2, section: "Window Bar", status: "AVAILABLE", activeGuests: 0 },
];

const initialMenuItems: IMenuItem[] = [
  {
    _id: "menu_001",
    name: "Terracotta Cortado",
    category: "Coffee",
    price: 220,
    costPrice: 50,
    description: "Equal parts espresso and silky textured milk served in an artisanal earthenware cup.",
    isAvailable: true,
    preparationTimeMinutes: 5,
  },
  {
    _id: "menu_002",
    name: "Cold Drip Ethiopian Yirgacheffe",
    category: "Coffee",
    price: 280,
    costPrice: 70,
    description: "12-hour slow cold brew with floral citrus notes and brown sugar finish.",
    isAvailable: true,
    preparationTimeMinutes: 2,
  },
  {
    _id: "menu_003",
    name: "Spiced Masala Chai Latte",
    category: "Tea & Beverages",
    price: 180,
    costPrice: 35,
    description: "CTC Assam black tea simmered with fresh cardamom, cinnamon, and oat milk.",
    isAvailable: true,
    preparationTimeMinutes: 6,
  },
  {
    _id: "menu_004",
    name: "Matcha Ceremonial Cloud",
    category: "Tea & Beverages",
    price: 310,
    costPrice: 90,
    description: "Uji first-harvest ceremonial matcha whisked with Madagascar vanilla cream.",
    isAvailable: true,
    preparationTimeMinutes: 5,
  },
  {
    _id: "menu_005",
    name: "Almond Frangipane Croissant",
    category: "Bakery & Desserts",
    price: 240,
    costPrice: 60,
    description: "Double baked buttery pastry filled with rich almond cream and toasted flakes.",
    isAvailable: true,
    preparationTimeMinutes: 3,
  },
  {
    _id: "menu_006",
    name: "Burnt Basque Cheesecake",
    category: "Bakery & Desserts",
    price: 320,
    costPrice: 80,
    description: "Caramelized crust with a molten, velvety cream cheese center.",
    isAvailable: true,
    preparationTimeMinutes: 2,
  },
  {
    _id: "menu_007",
    name: "Sourdough Avocado & Truffle Tartine",
    category: "Artisanal Mains",
    price: 390,
    costPrice: 110,
    description: "Handmade country sourdough, whipped Hass avocado, pickled shallots, white truffle oil.",
    isAvailable: true,
    preparationTimeMinutes: 12,
  },
  {
    _id: "menu_008",
    name: "Smoked Chicken Pesto Panini",
    category: "Artisanal Mains",
    price: 420,
    costPrice: 130,
    description: "Wood-fired herb chicken, house basil pesto, bocconcini on toasted ciabatta.",
    isAvailable: true,
    preparationTimeMinutes: 14,
  },
  {
    _id: "menu_009",
    name: "Truffle Parmesan Hand-cut Fries",
    category: "Sides & Quick Bites",
    price: 250,
    costPrice: 55,
    description: "Crispy skin-on potatoes dusted with 24-month aged parmesan and fresh herbs.",
    isAvailable: true,
    preparationTimeMinutes: 8,
  },
];

const initialOrders: IOrder[] = [
  {
    _id: "ord_hist_001",
    tableId: "tbl_01",
    tableNumber: "01",
    items: [
      { menuItemId: "menu_001", name: "Terracotta Cortado", price: 220, costPrice: 50, quantity: 2, subtotal: 440 },
      { menuItemId: "menu_005", name: "Almond Frangipane Croissant", price: 240, costPrice: 60, quantity: 2, subtotal: 480 },
    ],
    status: "COMPLETED",
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    subtotal: 920,
    tax: 46,
    discount: 0,
    total: 966,
    placedByRole: "GUEST",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: "ord_hist_002",
    tableId: "tbl_04",
    tableNumber: "04",
    items: [
      { menuItemId: "menu_002", name: "Cold Drip Ethiopian Yirgacheffe", price: 280, costPrice: 70, quantity: 1, subtotal: 280 },
      { menuItemId: "menu_007", name: "Sourdough Avocado & Truffle Tartine", price: 390, costPrice: 110, quantity: 1, subtotal: 390 },
    ],
    status: "COMPLETED",
    paymentStatus: "PAID",
    paymentMethod: "CARD",
    subtotal: 670,
    tax: 34,
    discount: 0,
    total: 704,
    placedByRole: "EMPLOYEE",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    _id: "ord_hist_003",
    tableId: "tbl_05",
    tableNumber: "05",
    items: [
      { menuItemId: "menu_001", name: "Terracotta Cortado", price: 220, costPrice: 50, quantity: 4, subtotal: 880 },
      { menuItemId: "menu_008", name: "Smoked Chicken Pesto Panini", price: 420, costPrice: 130, quantity: 2, subtotal: 840 },
      { menuItemId: "menu_009", name: "Truffle Parmesan Hand-cut Fries", price: 250, costPrice: 55, quantity: 2, subtotal: 500 },
    ],
    status: "COMPLETED",
    paymentStatus: "PAID",
    paymentMethod: "CASH",
    subtotal: 2220,
    tax: 111,
    discount: 0,
    total: 2331,
    placedByRole: "ADMIN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ord_active_001",
    tableId: "tbl_02",
    tableNumber: "02",
    items: [
      { menuItemId: "menu_004", name: "Matcha Ceremonial Cloud", price: 310, costPrice: 90, quantity: 2, subtotal: 620 },
      { menuItemId: "menu_006", name: "Burnt Basque Cheesecake", price: 320, costPrice: 80, quantity: 1, subtotal: 320 },
    ],
    status: "PREPARING",
    paymentStatus: "UNPAID",
    paymentMethod: "CASH",
    subtotal: 940,
    tax: 47,
    discount: 0,
    total: 987,
    placedByRole: "GUEST",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize global store singleton
if (!global.__cafeMockStore) {
  global.__cafeMockStore = {
    users: [...initialUsers],
    tables: [...initialTables],
    menuItems: [...initialMenuItems],
    orders: [...initialOrders],
  };
}

export const mockStore = global.__cafeMockStore;

// --- User Operations ---
export function getMockUsers(): IMockUser[] {
  return mockStore.users;
}

export function findMockUserByEmail(email: string): IMockUser | undefined {
  return mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function addMockUser(data: { name: string; email: string; password: string; role: UserRole }): Promise<IMockUser> {
  const existing = findMockUserByEmail(data.email);
  if (existing) {
    throw new Error(`User with email ${data.email} already exists`);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const newUser: IMockUser = {
    _id: `usr_mock_${Date.now()}`,
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    role: data.role,
    active: true,
    createdAt: new Date().toISOString(),
  };

  mockStore.users.push(newUser);
  return newUser;
}

export function deleteMockUser(id: string): boolean {
  const index = mockStore.users.findIndex((u) => u._id === id);
  if (index !== -1) {
    mockStore.users.splice(index, 1);
    return true;
  }
  return false;
}

// --- Table Operations ---
export function getMockTables(): ITable[] {
  return mockStore.tables;
}

export function addMockTable(table: { tableNumber: string; capacity?: number; section?: string }): ITable {
  const existing = mockStore.tables.find((t) => t.tableNumber === table.tableNumber);
  if (existing) {
    throw new Error(`Table ${table.tableNumber} already exists`);
  }

  const newTable: ITable = {
    _id: `tbl_mock_${Date.now()}`,
    tableNumber: table.tableNumber,
    capacity: table.capacity || 4,
    section: table.section || "Courtyard Terrace",
    status: "AVAILABLE",
    activeGuests: 0,
    currentOrderId: null,
  };

  mockStore.tables.push(newTable);
  return newTable;
}

export function updateMockTable(id: string, updates: Partial<ITable>): ITable | null {
  const table = mockStore.tables.find((t) => t._id === id);
  if (!table) return null;
  Object.assign(table, updates);
  return table;
}

// --- Menu Operations ---
export function getMockMenuItems(): IMenuItem[] {
  return mockStore.menuItems;
}

export function addMockMenuItem(item: Omit<IMenuItem, "_id">): IMenuItem {
  const newItem: IMenuItem = {
    _id: `menu_mock_${Date.now()}`,
    ...item,
  };
  mockStore.menuItems.push(newItem);
  return newItem;
}

export function updateMockMenuItem(id: string, updates: Partial<IMenuItem>): IMenuItem | null {
  const item = mockStore.menuItems.find((m) => m._id === id);
  if (!item) return null;
  Object.assign(item, updates);
  return item;
}

export function deleteMockMenuItem(id: string): boolean {
  const index = mockStore.menuItems.findIndex((m) => m._id === id);
  if (index !== -1) {
    mockStore.menuItems.splice(index, 1);
    return true;
  }
  return false;
}

// --- Order Operations ---
export function getMockOrders(): IOrder[] {
  return mockStore.orders;
}

export function addMockOrder(orderData: any): IOrder {
  const newOrder: IOrder = {
    _id: `ord_mock_${Date.now()}`,
    tableId: orderData.tableId,
    tableNumber: orderData.tableNumber,
    items: orderData.items,
    status: "PREPARING",
    paymentStatus: "UNPAID",
    paymentMethod: orderData.paymentMethod || "CASH",
    subtotal: orderData.subtotal,
    tax: orderData.tax,
    discount: orderData.discount || 0,
    total: orderData.total,
    placedByRole: orderData.placedByRole || "GUEST",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStore.orders.push(newOrder);

  // Mark table as occupied
  updateMockTable(orderData.tableId, {
    status: "OCCUPIED",
    currentOrderId: newOrder._id,
  });

  return newOrder;
}

export function settleMockOrder(orderId: string, paymentMethod: any): IOrder | null {
  const order = mockStore.orders.find((o) => o._id === orderId);
  if (!order) return null;

  order.paymentStatus = "PAID";
  order.status = "COMPLETED";
  order.paymentMethod = paymentMethod || "CASH";
  order.updatedAt = new Date().toISOString();

  // Free table
  updateMockTable(order.tableId, {
    status: "AVAILABLE",
    currentOrderId: null,
  });

  return order;
}

// --- Analytics Calculations ---
export function getMockAnalytics(): {
  summary: ISalesSummary;
  soldItems: ISoldItemMetric[];
  dailySales: IDailySalesMetric[];
  paymentBreakdown: { _id: string; total: number; count: number }[];
} {
  const paidOrders = mockStore.orders.filter((o) => o.paymentStatus === "PAID");

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = paidOrders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalItemsSold = paidOrders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  // Sold items map
  const itemMap = new Map<string, { unitsSold: number; totalRevenue: number }>();
  for (const o of paidOrders) {
    for (const item of o.items) {
      const curr = itemMap.get(item.name) || { unitsSold: 0, totalRevenue: 0 };
      curr.unitsSold += item.quantity;
      curr.totalRevenue += item.subtotal;
      itemMap.set(item.name, curr);
    }
  }

  const soldItems: ISoldItemMetric[] = Array.from(itemMap.entries())
    .map(([name, val]) => ({
      name,
      unitsSold: val.unitsSold,
      totalRevenue: val.totalRevenue,
      category: "Artisan Cafe",
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold);

  // Daily sales map
  const dateMap = new Map<string, { revenue: number; ordersCount: number }>();
  for (const o of paidOrders) {
    const d = o.createdAt.slice(0, 10);
    const curr = dateMap.get(d) || { revenue: 0, ordersCount: 0 };
    curr.revenue += o.total;
    curr.ordersCount += 1;
    dateMap.set(d, curr);
  }

  const dailySales: IDailySalesMetric[] = Array.from(dateMap.entries())
    .map(([date, val]) => ({
      date,
      revenue: val.revenue,
      ordersCount: val.ordersCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Payment breakdown
  const payMap = new Map<string, { total: number; count: number }>();
  for (const o of paidOrders) {
    const method = o.paymentMethod || "CASH";
    const curr = payMap.get(method) || { total: 0, count: 0 };
    curr.total += o.total;
    curr.count += 1;
    payMap.set(method, curr);
  }

  const paymentBreakdown = Array.from(payMap.entries()).map(([method, val]) => ({
    _id: method,
    total: val.total,
    count: val.count,
  }));

  return {
    summary: { totalRevenue, totalOrders, averageOrderValue, totalItemsSold },
    soldItems,
    dailySales,
    paymentBreakdown,
  };
}

// Reset mock store back to defaults
export function resetMockStore() {
  mockStore.users = [...initialUsers];
  mockStore.tables = [...initialTables];
  mockStore.menuItems = [...initialMenuItems];
  mockStore.orders = [...initialOrders];
}
