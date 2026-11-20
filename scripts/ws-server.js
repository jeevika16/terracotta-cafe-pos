const { WebSocketServer, WebSocket } = require("ws");

const WS_PORT = parseInt(process.env.NEXT_PUBLIC_WS_PORT || "3001", 10);

const wss = new WebSocketServer({ port: WS_PORT }, () => {
  console.log("--------------------------------------------------");
  console.log(`📡 Terracotta Cafe Kitchen WebSocket Server Online`);
  console.log(`🔗 Address: ws://localhost:${WS_PORT}`);
  console.log("--------------------------------------------------");
});

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[WebSocket] Client connected. Total active clients: ${clients.size}`);

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
      console.log(`[WebSocket] Received message:`, data.type);
      // Broadcast to other clients
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error("[WebSocket] Parse error:", e.message);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Total active clients: ${clients.size}`);
  });

  ws.on("error", (err) => {
    clients.delete(ws);
    console.warn(`[WebSocket] Client socket error:`, err.message);
  });
});

wss.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`[WebSocket] Port ${WS_PORT} already in use; exiting standalone script.`);
    process.exit(0);
  }
  console.error("[WebSocket] Server error:", err);
});
