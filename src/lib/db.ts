import mongoose from "mongoose";
import dns from "dns";

// Configure Node.js to use public DNS servers (Google & Cloudflare) for SRV resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e: any) {
  // Ignore in environments where setting DNS servers is restricted
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// export const DIRECT_REPLICA_URI =
//   "mongodb://jeevikajeevi16_db_user:qcgK7JwYstZbjfkW@ac-hl3rjpm-shard-00-00.mh92blv.mongodb.net:27017,ac-hl3rjpm-shard-00-01.mh92blv.mongodb.net:27017,ac-hl3rjpm-shard-00-02.mh92blv.mongodb.net:27017/cafe_billing_db?ssl=true&replicaSet=atlas-127r9b-shard-0&authSource=admin&retryWrites=true&w=majority";

export function cleanMongoUri(): string {
  const uri = process.env.MONGODB_URI || ""
  return uri.trim().replace(/^["']|["']$/g, "");
}
console.log({url :  process.env.MONGODB_URI})

export async function connectDB(): Promise<typeof mongoose | null> {
  // If already connected and connection is alive, return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = cleanMongoUri();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        console.log("Connected to MongoDB successfully");
        return mongooseInstance;
      })
      .catch(async (err) => {
        console.warn("MongoDB primary SRV notice:", err.message);
        if (uri.includes("+srv://")) {
          console.log("Attempting direct replica set connection fallback...");
          try {
            return await mongoose.connect(cleanMongoUri(), opts);
          } catch (fallbackErr: any) {
            console.error("MongoDB direct replica set notice:", fallbackErr?.message);
          }
        }
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
    if (!cached.conn) {
      cached.promise = null;
    }
  } catch (e: any) {
    cached.promise = null;
    cached.conn = null;
    return null;
  }

  return cached.conn;
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
