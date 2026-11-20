export type UserRole = "ADMIN" | "EMPLOYEE" | "GUEST";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface IUserAccount {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
}

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING";

export interface ITable {
  _id: string;
  tableNumber: string;
  capacity: number;
  section: string;
  status: TableStatus;
  currentOrderId?: string | null;
  activeGuests?: number;
}

export interface IMenuItem {
  _id: string;
  name: string;
  category: "Coffee" | "Tea & Beverages" | "Bakery & Desserts" | "Artisanal Mains" | "Sides & Quick Bites";
  price: number;
  costPrice: number;
  description: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTimeMinutes?: number;
}

export interface ICartItem {
  menuItemId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  notes?: string;
}

export interface IOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export type OrderStatus = "PENDING" | "PREPARING" | "SERVED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "SPLIT";

export interface IOrder {
  _id: string;
  tableId: string;
  tableNumber: string;
  items: IOrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  placedByRole: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ISalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
}

export interface ISoldItemMetric {
  name: string;
  unitsSold: number;
  totalRevenue: number;
  category: string;
}

export interface IDailySalesMetric {
  date: string;
  revenue: number;
  ordersCount: number;
}
