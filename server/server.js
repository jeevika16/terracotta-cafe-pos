const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// 1. Load environment variables
const envLocalPath = path.resolve(__dirname, "../.env.local");
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const { connectDB } = require("./config/db");
const { initWebSocket } = require("./websocket");

// Import Routes
const tableRoutes = require("./routes/tableRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "5000", 10);

// 2. Global Middleware
app.use(
  cors({
    origin: true, // Allow frontend on localhost:3000 or any origin
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m";
    console.log(
      `[Express] ${req.method} ${req.originalUrl} -> ${color}${res.statusCode}\x1b[0m (${duration}ms)`
    );
  });
  next();
});

// 3. Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Terracotta Cafe Express API Server",
    database: require("mongoose").connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Terracotta Cafe Express API Server",
    database: require("mongoose").connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED",
    timestamp: new Date().toISOString(),
  });
});

// 4. API Endpoints
app.use("/api/tables", tableRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

// 5. 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found on Express server` });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Express Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// 7. Start Server & Database
initWebSocket(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log(`☕ Terracotta Cafe Express Backend Server Online`);
  console.log(`🚀 API Base URL: http://localhost:${PORT}`);
  console.log(`📡 WebSocket:    ws://localhost:${PORT}`);
  console.log(`🩺 Health:       http://localhost:${PORT}/health`);
  console.log("==================================================");
});

connectDB();

module.exports = { app, server };
