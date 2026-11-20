import mongoose from "mongoose";
import { seedMongoDatabase } from "./seedHelper";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
  var __mongoAutoSeeded: boolean | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function cleanMongoUri(): string {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/cafe_billing_db";
  return uri.trim().replace(/^["']|["']$/g, "");
}

export async function connectDB(): Promise<typeof mongoose | null> {
  // If already connected and connection is alive, return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = cleanMongoUri();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2500, // Fail fast so UI remains ultra responsive
      connectTimeoutMS: 2500,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then(async (mongooseInstance) => {
        console.log("Connected to MongoDB successfully");
        
        // Auto-seed if collections are empty on first successful connect
        if (!global.__mongoAutoSeeded) {
          global.__mongoAutoSeeded = true;
          try {
            await seedMongoDatabase(false);
          } catch (seedErr: any) {
            console.warn("Auto-seed error on connect:", seedErr?.message);
          }
        }

        return mongooseInstance;
      })
      .catch((err) => {
        console.warn(
          "MongoDB connection unavailable (" + err.message + "). Falling back to memory/mock store."
        );
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
