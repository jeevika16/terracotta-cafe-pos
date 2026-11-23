const { WebSocketServer, WebSocket } = require("ws");

let wss = null;
const clients = new Set();
const recentNotifications = [];

function initWebSocket(server) {
  try {
    wss = new WebSocketServer({ server });
    console.log("📡 [WebSocket] Integrated WebSocket server listening on HTTP server");

    wss.on("connection", (ws) => {
      clients.add(ws);
      console.log(`[WebSocket] Client connected. Total active clients: ${clients.size}`);

      // Handshake
      ws.send(
        JSON.stringify({
          type: "CONNECTED",
          message: "Connected to Terracotta Kitchen WebSocket Live Link",
          timestamp: Date.now(),
        })
      );

      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          for (const client of clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          }
        } catch (e) {
          console.error("[WebSocket] Message parse error:", e.message);
        }
      });

      ws.on("close", () => {
        clients.delete(ws);
      });

      ws.on("error", () => {
        clients.delete(ws);
      });
    });

    return wss;
  } catch (err) {
    console.warn("⚠️ [WebSocket] Failed to bind to HTTP server:", err.message);
    return null;
  }
}

function broadcastKitchenNotification(notification) {
  const payload = {
    id: notification.id || `notif_${Date.now()}`,
    ...notification,
    timestamp: notification.timestamp || Date.now(),
  };

  recentNotifications.unshift(payload);
  if (recentNotifications.length > 50) recentNotifications.pop();

  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }

  return payload;
}

function getRecentNotifications() {
  return recentNotifications;
}

module.exports = {
  initWebSocket,
  broadcastKitchenNotification,
  getRecentNotifications,
};
