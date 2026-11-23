const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const dns = require("dns");

// Configure Node.js to use public Google and Cloudflare DNS to bypass local ISP SRV resolution blocks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  console.warn("[DNS] Custom DNS configuration notice:", e.message);
}

// Load .env.local first, fallback to .env
const envLocalPath = path.resolve(__dirname, "../../.env.local");
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Direct standard non-SRV replica set URI (works even when SRV DNS is blocked completely)
const DIRECT_REPLICA_URI =
  "mongodb://jeevikajeevi16_db_user:qcgK7JwYstZbjfkW@ac-hl3rjpm-shard-00-00.mh92blv.mongodb.net:27017,ac-hl3rjpm-shard-00-01.mh92blv.mongodb.net:27017,ac-hl3rjpm-shard-00-02.mh92blv.mongodb.net:27017/cafe_billing_db?ssl=true&replicaSet=atlas-127r9b-shard-0&authSource=admin&retryWrites=true&w=majority";

function cleanMongoUri(rawUri) {
  const uri = rawUri || process.env.MONGODB_URI || "mongodb://localhost:27017/cafe_billing_db";
  return uri.trim().replace(/^["']|["']$/g, "");
}

async function connectDB() {
  const primaryUri = cleanMongoUri();
  const opts = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  };

  try {
    const conn = await mongoose.connect(primaryUri, opts);
    console.log(`✅ [MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`⚠️ [MongoDB] Primary SRV connection notice: ${err.message}`);

    // If SRV lookup failed (ECONNREFUSED / querySrv), failover directly to standard replica set URI
    if (primaryUri.includes("+srv://")) {
      console.log("🔄 [MongoDB] Switching to direct non-SRV replica set connection...");
      try {
        const fallbackConn = await mongoose.connect(DIRECT_REPLICA_URI, opts);
        console.log(`✅ [MongoDB] Connected via direct replica set: ${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (fallbackErr) {
        console.error(`❌ [MongoDB] Direct replica set connection failed: ${fallbackErr.message}`);
      }
    }

    return null;
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ [MongoDB] Disconnected from database");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 [MongoDB] Reconnected to database");
});

module.exports = { connectDB, cleanMongoUri, DIRECT_REPLICA_URI };
