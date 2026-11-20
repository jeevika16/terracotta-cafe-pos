import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Table from "@/models/Table";
import { getMockOrders, addMockOrder, settleMockOrder } from "@/lib/mockData";
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
          if (order) return NextResponse.json(order);
        } else if (tableId) {
          const order = await Order.findOne({ tableId, status: { $ne: "COMPLETED" } }).sort({ createdAt: -1 });
          if (order) return NextResponse.json(order);
        } else {
          const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
          if (orders && orders.length > 0) return NextResponse.json(orders);
        }
      } catch (dbErr: any) {
        console.warn("MongoDB get orders error, using mock fallback:", dbErr?.message);
      }
    }

    // Mock store
    const allMockOrders = getMockOrders();
    if (id) {
      const found = allMockOrders.find((o) => o._id === id);
      return NextResponse.json(found || null);
    }
    if (tableId) {
      const found = allMockOrders.find((o) => o.tableId === tableId && o.status !== "COMPLETED");
      return NextResponse.json(found || null);
    }
    return NextResponse.json(allMockOrders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create order (Can be placed by Guest, Employee, or Admin)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role || "GUEST";

    const body = await req.json();
    const { tableId, tableNumber, items, subtotal, tax, discount, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    const db = await connectDB();
    let createdOrder: any = null;

    if (db) {
      try {
        // 1. Create the new order
        createdOrder = await Order.create({
          tableId,
          tableNumber,
          items,
          subtotal,
          tax,
          discount: discount || 0,
          total,
          status: "PREPARING",
          paymentStatus: "UNPAID",
          placedByRole: role,
        });

        // 2. Mark table as OCCUPIED and link currentOrderId
        await Table.findByIdAndUpdate(tableId, {
          status: "OCCUPIED",
          currentOrderId: createdOrder._id,
        });

        // Also sync mock store
        try {
          addMockOrder({ ...body, placedByRole: role });
        } catch (_) {}
      } catch (dbErr: any) {
        console.warn("MongoDB create order error, using mock fallback:", dbErr?.message);
      }
    }

    // Fallback to mock store if DB was unavailable
    if (!createdOrder) {
      createdOrder = addMockOrder({ ...body, placedByRole: role });
    }

    // Broadcast WebSocket notification to Kitchen, Staff, and Admin!
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
    } catch (wsErr: any) {
      console.warn("Failed to broadcast kitchen notification:", wsErr?.message);
    }

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update order or settle payment (Employees & Admin)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Only staff can update or settle orders" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, action, paymentMethod } = body;

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

            // Free the table
            await Table.findByIdAndUpdate(order.tableId, {
              status: "AVAILABLE",
              currentOrderId: null,
            });

            settleMockOrder(orderId, paymentMethod);

            // Broadcast Table cleared event
            broadcastKitchenNotification({
              type: "ORDER_SETTLED",
              orderId,
              tableId: order.tableId,
              tableNumber: order.tableNumber,
              message: `Table ${order.tableNumber} bill settled and table cleared.`,
              timestamp: Date.now(),
            });

            return NextResponse.json({ success: true, message: "Order settled and table cleared", order });
          }

          const updated = await Order.findByIdAndUpdate(orderId, body, { new: true });
          return NextResponse.json(updated);
        }
      } catch (dbErr: any) {
        console.warn("MongoDB settle order error, using mock fallback:", dbErr?.message);
      }
    }

    // Fallback to mock store
    if (action === "SETTLE_PAYMENT") {
      const settled = settleMockOrder(orderId, paymentMethod);
      if (!settled) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      broadcastKitchenNotification({
        type: "ORDER_SETTLED",
        orderId,
        tableId: settled.tableId,
        tableNumber: settled.tableNumber,
        message: `Table ${settled.tableNumber} bill settled and table cleared.`,
        timestamp: Date.now(),
      });

      return NextResponse.json({ success: true, message: "Order settled and table cleared", order: settled });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
