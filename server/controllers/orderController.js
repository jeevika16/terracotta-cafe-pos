const Order = require("../models/Order");
const Table = require("../models/Table");
const { broadcastKitchenNotification } = require("../websocket");

// GET /api/orders - Fetch orders (by id, tableId, or all)
async function getOrders(req, res) {
  try {
    const { id, tableId } = req.query;

    if (id) {
      const order = await Order.findById(id);
      return res.status(200).json(order || null);
    }

    if (tableId) {
      const order = await Order.findOne({ tableId, status: { $ne: "COMPLETED" } }).sort({ createdAt: -1 });
      return res.status(200).json(order || null);
    }

    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    return res.status(200).json(orders || []);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch orders" });
  }
}

// POST /api/orders - Create a new order
async function createOrder(req, res) {
  try {
    const { tableId, tableNumber, items, subtotal, tax, discount, total, placedByRole } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item" });
    }

    const createdOrder = await Order.create({
      tableId,
      tableNumber,
      items,
      subtotal: subtotal || 0,
      tax: tax || 0,
      discount: discount || 0,
      total: total || 0,
      status: "PREPARING",
      paymentStatus: "UNPAID",
      placedByRole: placedByRole || "GUEST",
    });

    // Mark table as OCCUPIED in database
    if (tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: "OCCUPIED",
        currentOrderId: createdOrder._id,
      });
    }

    // Broadcast WebSocket notification to Kitchen & Staff
    try {
      broadcastKitchenNotification({
        type: "NEW_KITCHEN_ORDER",
        order: {
          _id: createdOrder._id.toString(),
          tableId,
          tableNumber,
          items,
          total,
          placedByRole: placedByRole || "GUEST",
          createdAt: new Date().toISOString(),
        },
        message: `🔔 New Kitchen Order! Table ${tableNumber} placed ${items.length} item${items.length > 1 ? "s" : ""}`,
        timestamp: Date.now(),
      });
    } catch (wsErr) {
      console.warn("WebSocket broadcast warning:", wsErr.message);
    }

    return res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: error.message || "Failed to create order" });
  }
}

// PATCH /api/orders - Settle order or update order status
async function patchOrder(req, res) {
  try {
    const { orderId, action, paymentMethod, ...otherUpdates } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found in database" });
    }

    if (action === "SETTLE_PAYMENT") {
      order.paymentStatus = "PAID";
      order.status = "COMPLETED";
      order.paymentMethod = paymentMethod || "CASH";
      await order.save();

      // Free the table in database
      if (order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, {
          status: "AVAILABLE",
          currentOrderId: null,
        });
      }

      // Broadcast order settled notification
      try {
        broadcastKitchenNotification({
          type: "ORDER_SETTLED",
          orderId,
          tableId: order.tableId,
          tableNumber: order.tableNumber,
          message: `Table ${order.tableNumber} bill settled and table cleared.`,
          timestamp: Date.now(),
        });
      } catch (wsErr) {
        console.warn("WebSocket broadcast warning:", wsErr.message);
      }

      return res.status(200).json({
        success: true,
        message: "Order settled and table cleared in database",
        order,
      });
    }

    // Generic status update
    Object.assign(order, otherUpdates);
    await order.save();
    return res.status(200).json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({ error: error.message || "Failed to update order" });
  }
}

module.exports = {
  getOrders,
  createOrder,
  patchOrder,
};
