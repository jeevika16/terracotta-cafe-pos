import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Table from "@/models/Table";
import { getDbOrders, createDbOrder, settleDbOrder } from "@/lib/persistentDb";
import { broadcastKitchenNotification } from "@/lib/socketServer";

// GET order by ID or active orders
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const tableId = searchParams.get("tableId");

    const db = await connectDB();
    if (db) {
      try {
        if (id) {
          const order = await Order.findById(id);
          return NextResponse.json(order || null);
        } else if (tableId) {
          const order = await Order.findOne({ tableId, status: { $ne: "COMPLETED" } }).sort({ createdAt: -1 });
          return NextResponse.json(order || null);
        } else {
          const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
          return NextResponse.json(orders || []);
        }
      } catch (dbErr: any) {
        console.warn("MongoDB get orders notice:", dbErr?.message);
      }
    }

    const allDbOrders = getDbOrders() || [];
    if (id) {
      const found = allDbOrders.find((o) => o._id === id);
      return NextResponse.json(found || null);
    }
    if (tableId) {
      const found = allDbOrders.find((o) => o.tableId === tableId && o.status !== "COMPLETED");
      return NextResponse.json(found || null);
    }
    return NextResponse.json(allDbOrders);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch orders" }, { status: 500 });
  }
}

// POST create order
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role || "GUEST";

    const body = await req.json();
    const { tableId, tableNumber, items, subtotal, tax, discount, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    let createdOrder: any = null;

    const db = await connectDB();
    if (db) {
      try {
        createdOrder = await Order.create({
          tableId,
          tableNumber,
          items,
          subtotal: subtotal || 0,
          tax: tax || 0,
          discount: discount || 0,
          total: total || 0,
          status: "PREPARING",
          paymentStatus: "UNPAID",
          placedByRole: role,
        });

        // Mark table as OCCUPIED in MongoDB
        if (tableId) {
          await Table.findByIdAndUpdate(tableId, {
            status: "OCCUPIED",
            currentOrderId: createdOrder._id,
          });
        }
      } catch (dbErr: any) {
        console.warn("MongoDB create order notice:", dbErr?.message);
      }
    }

    const persisted = createDbOrder({ ...body, placedByRole: role });
    if (!createdOrder) createdOrder = persisted;

    try {
      broadcastKitchenNotification({
        type: "NEW_KITCHEN_ORDER",
        order: {
          _id: createdOrder._id.toString(),
          tableId,
          tableNumber,
          items,
          total,
          placedByRole: role,
          createdAt: new Date().toISOString(),
        },
        message: `🔔 New Kitchen Order! Table ${tableNumber} placed ${items.length} item${items.length > 1 ? "s" : ""}`,
        timestamp: Date.now(),
      });
    } catch (_) {}

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH settle payment
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Only staff can update or settle orders" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, action, paymentMethod } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    let settledOrder: any = null;

    const db = await connectDB();
    if (db) {
      try {
        const order = await Order.findById(orderId);
        if (order) {
          if (action === "SETTLE_PAYMENT") {
            order.paymentStatus = "PAID";
            order.status = "COMPLETED";
            order.paymentMethod = paymentMethod || "CASH";
            await order.save();

            if (order.tableId) {
              await Table.findByIdAndUpdate(order.tableId, {
                status: "AVAILABLE",
                currentOrderId: null,
              });
            }

            settledOrder = order;
          } else {
            const updated = await Order.findByIdAndUpdate(orderId, body, { new: true });
            return NextResponse.json(updated);
          }
        }
      } catch (dbErr: any) {
        console.warn("MongoDB settle order notice:", dbErr?.message);
      }
    }

    if (action === "SETTLE_PAYMENT") {
      const persisted = settleDbOrder(orderId, paymentMethod);
      if (!settledOrder) settledOrder = persisted;

      if (!settledOrder) {
        return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
      }

      try {
        broadcastKitchenNotification({
          type: "ORDER_SETTLED",
          orderId,
          tableId: settledOrder.tableId,
          tableNumber: settledOrder.tableNumber,
          message: `Table ${settledOrder.tableNumber} bill settled and table cleared.`,
          timestamp: Date.now(),
        });
      } catch (_) {}

      return NextResponse.json({
        success: true,
        message: "Order settled and table cleared in database",
        order: settledOrder,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
