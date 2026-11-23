import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { ITable, IMenuItem, IOrder, UserRole, ISalesSummary, ISoldItemMetric, IDailySalesMetric } from "@/types";

export interface IDbUser {
  _id: string;
  name: string;
  email: string;
  password: string; // bcrypt hash
  role: UserRole;
  active: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  tables: ITable[];
  menuItems: IMenuItem[];
  users: IDbUser[];
  orders: IOrder[];
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DATA_DIR, "cafe_db.json");

const EMPTY_DATABASE: DatabaseSchema = {
  tables: [],
  menuItems: [],
  users: [],
  orders: [],
};

function ensureDbFile(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DATABASE, null, 2), "utf-8");
      return { tables: [], menuItems: [], users: [], orders: [] };
    }

    const data = fs.readFileSync(DB_FILE, "utf-8").trim();
    if (!data) {
      fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DATABASE, null, 2), "utf-8");
      return { tables: [], menuItems: [], users: [], orders: [] };
    }

    const parsed = JSON.parse(data);
    return {
      tables: Array.isArray(parsed?.tables) ? parsed.tables : [],
      menuItems: Array.isArray(parsed?.menuItems) ? parsed.menuItems : [],
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
    };
  } catch (err) {
    console.warn("Error reading database file, using empty schema:", err);
    return { tables: [], menuItems: [], users: [], orders: [] };
  }
}

function saveDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// ==================== TABLE OPERATIONS ====================

export function getDbTables(): ITable[] {
  const db = ensureDbFile();
  const tables = db?.tables || [];
  return [...tables].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));
}

export function createDbTable(data: { tableNumber: string; capacity?: number; section?: string }): ITable {
  const db = ensureDbFile();
  const existing = db.tables.find((t) => t.tableNumber === data.tableNumber);
  if (existing) {
    throw new Error(`Table ${data.tableNumber} already exists in database`);
  }

  const newTable: ITable = {
    _id: `tbl_${Date.now()}`,
    tableNumber: data.tableNumber.trim(),
    capacity: data.capacity || 4,
    section: data.section || "Main Area",
    status: "AVAILABLE",
    activeGuests: 0,
    currentOrderId: null,
  };

  db.tables.push(newTable);
  saveDb(db);
  return newTable;
}

export function updateDbTable(id: string, updates: Partial<ITable>): ITable | null {
  const db = ensureDbFile();
  const table = db.tables.find((t) => t._id === id || t.tableNumber === id);
  if (!table) return null;

  Object.assign(table, updates);
  saveDb(db);
  return table;
}

// ==================== MENU OPERATIONS ====================

export function getDbMenuItems(): IMenuItem[] {
  const db = ensureDbFile();
  const items = db?.menuItems || [];
  return [...items].sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));
}

export function createDbMenuItem(data: Omit<IMenuItem, "_id">): IMenuItem {
  const db = ensureDbFile();
  const newItem: IMenuItem = {
    _id: `menu_${Date.now()}`,
    ...data,
  };

  db.menuItems.push(newItem);
  saveDb(db);
  return newItem;
}

export function updateDbMenuItem(id: string, updates: Partial<IMenuItem>): IMenuItem | null {
  const db = ensureDbFile();
  const item = db.menuItems.find((m) => m._id === id);
  if (!item) return null;

  Object.assign(item, updates);
  saveDb(db);
  return item;
}

export function deleteDbMenuItem(id: string): boolean {
  const db = ensureDbFile();
  const index = db.menuItems.findIndex((m) => m._id === id);
  if (index !== -1) {
    db.menuItems.splice(index, 1);
    saveDb(db);
    return true;
  }
  return false;
}

// ==================== USER OPERATIONS ====================

export function getDbUsers(): IDbUser[] {
  const db = ensureDbFile();
  const users = db?.users || [];
  return [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function findDbUserByEmail(email: string): IDbUser | undefined {
  const db = ensureDbFile();
  const users = db?.users || [];
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createDbUser(data: { name: string; email: string; password: string; role: UserRole }): Promise<IDbUser> {
  const db = ensureDbFile();
  const existing = findDbUserByEmail(data.email);
  if (existing) {
    throw new Error(`User with email "${data.email}" already exists`);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const newUser: IDbUser = {
    _id: `usr_${Date.now()}`,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: hashedPassword,
    role: data.role,
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);
  return newUser;
}

export function deleteDbUser(id: string): boolean {
  const db = ensureDbFile();
  const index = db.users.findIndex((u) => u._id === id);
  if (index !== -1) {
    db.users.splice(index, 1);
    saveDb(db);
    return true;
  }
  return false;
}

// ==================== ORDER OPERATIONS ====================

export function getDbOrders(): IOrder[] {
  const db = ensureDbFile();
  const orders = db?.orders || [];
  return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createDbOrder(orderData: any): IOrder {
  const db = ensureDbFile();
  const newOrder: IOrder = {
    _id: `ord_${Date.now()}`,
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

  db.orders.push(newOrder);

  // Update table in db to OCCUPIED
  const table = db.tables.find((t) => t._id === orderData.tableId || t.tableNumber === orderData.tableNumber);
  if (table) {
    table.status = "OCCUPIED";
    table.currentOrderId = newOrder._id;
  }

  saveDb(db);
  return newOrder;
}

export function settleDbOrder(orderId: string, paymentMethod?: string): IOrder | null {
  const db = ensureDbFile();
  const order = db.orders.find((o) => o._id === orderId);
  if (!order) return null;

  order.paymentStatus = "PAID";
  order.status = "COMPLETED";
  order.paymentMethod = (paymentMethod as any) || "CASH";
  order.updatedAt = new Date().toISOString();

  // Free table
  const table = db.tables.find((t) => t._id === order.tableId || t.tableNumber === order.tableNumber);
  if (table) {
    table.status = "AVAILABLE";
    table.currentOrderId = null;
  }

  saveDb(db);
  return order;
}

// ==================== ANALYTICS ====================

export function getDbAnalytics(): {
  summary: ISalesSummary;
  soldItems: ISoldItemMetric[];
  dailySales: IDailySalesMetric[];
  paymentBreakdown: { _id: string; total: number; count: number }[];
} {
  const db = ensureDbFile();
  const orders = db?.orders || [];
  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = paidOrders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalItemsSold = paidOrders.reduce(
    (sum, o) => sum + (o.items || []).reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  const itemMap = new Map<string, { unitsSold: number; totalRevenue: number }>();
  for (const o of paidOrders) {
    for (const item of o.items || []) {
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

  const dateMap = new Map<string, { revenue: number; ordersCount: number }>();
  for (const o of paidOrders) {
    const d = o.createdAt ? o.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
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
