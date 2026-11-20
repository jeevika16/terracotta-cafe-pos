import { WebSocketServer, WebSocket } from "ws";

declare global {
  var __wss: WebSocketServer | undefined;
  var __wsClients: Set<WebSocket> | undefined;
  var __recentNotifications: any[] | undefined;
}

if (!global.__recentNotifications) {
  global.__recentNotifications = [];
}

const WS_PORT = parseInt(process.env.NEXT_PUBLIC_WS_PORT || "3001", 10);

export function getWebSocketServer(): WebSocketServer | null {
  if (typeof window !== "undefined") return null;

  if (!global.__wss) {
    try {
      const wss = new WebSocketServer({ port: WS_PORT });
      global.__wsClients = new Set();

      wss.on("connection", (ws: WebSocket) => {
        global.__wsClients?.add(ws);

        ws.on("close", () => {
          global.__wsClients?.delete(ws);
        });

        ws.on("error", () => {
          global.__wsClients?.delete(ws);
        });

        // Send confirmation handshake
        ws.send(
          JSON.stringify({
            type: "CONNECTED",
            message: "Connected to Terracotta Kitchen WebSocket Live Link",
            timestamp: Date.now(),
          })
        );
      });

      wss.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.log(`[WebSocket] Port ${WS_PORT} already bound; listening on existing server.`);
        } else {
          console.warn("[WebSocket] Server error:", err?.message);
        }
      });

      global.__wss = wss;
      console.log(`[WebSocket] Terracotta Kitchen Server running on ws://localhost:${WS_PORT}`);
    } catch (e: any) {
      console.warn("[WebSocket] Initialization notice:", e?.message);
    }
  }

  return global.__wss || null;
}

export function broadcastKitchenNotification(payload: any) {
  // Store in memory queue
  if (!global.__recentNotifications) {
    global.__recentNotifications = [];
  }
  global.__recentNotifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...payload,
    timestamp: Date.now(),
  });
  if (global.__recentNotifications.length > 30) {
    global.__recentNotifications = global.__recentNotifications.slice(0, 30);
  }

  try {
    getWebSocketServer();
    if (global.__wsClients) {
      const message = JSON.stringify(payload);
      global.__wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  } catch (err: any) {
    console.warn("[WebSocket] Broadcast error:", err?.message);
  }
}

export function getRecentNotifications() {
  return global.__recentNotifications || [];
}
