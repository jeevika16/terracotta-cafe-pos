const { getRecentNotifications, broadcastKitchenNotification } = require("../websocket");

// GET /api/notifications
async function getNotifications(req, res) {
  const notifs = getRecentNotifications();
  return res.status(200).json({
    success: true,
    notifications: notifs,
    wsPort: parseInt(process.env.NEXT_PUBLIC_WS_PORT || "3001", 10),
  });
}

// POST /api/notifications
async function createNotification(req, res) {
  try {
    const { order, message, type } = req.body;
    const notification = {
      type: type || "NEW_KITCHEN_ORDER",
      order: order || {},
      message: message || "Kitchen Notification",
      timestamp: Date.now(),
    };

    const broadcasted = broadcastKitchenNotification(notification);
    return res.status(200).json({ success: true, notification: broadcasted });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getNotifications,
  createNotification,
};
