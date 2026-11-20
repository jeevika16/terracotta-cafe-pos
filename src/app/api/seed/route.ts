import { NextResponse } from "next/server";
import { connectDB, isDatabaseConnected } from "@/lib/db";
import { seedMongoDatabase, SAMPLE_USERS, SAMPLE_TABLES, SAMPLE_MENU } from "@/lib/seedHelper";
import { resetMockStore, getMockUsers, getMockTables, getMockMenuItems } from "@/lib/mockData";

export async function GET(req: Request) {
  return handleSeed(req);
}

export async function POST(req: Request) {
  return handleSeed(req);
}

async function handleSeed(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceClean = searchParams.get("clean") === "true";

  let dbResult: any = null;
  let isDb = false;

  try {
    const db = await connectDB();
    if (db) {
      isDb = true;
      dbResult = await seedMongoDatabase(forceClean);
    }
  } catch (err: any) {
    console.warn("Seed error on MongoDB:", err?.message);
  }

  // Reset/sync mock store as well
  resetMockStore();

  return NextResponse.json({
    success: true,
    message: isDb
      ? "Successfully seeded MongoDB database with sample data & authentication credentials!"
      : "MongoDB is not reachable; mock in-memory store initialized with sample data & auth credentials.",
    databaseConnected: isDb,
    mongoDetails: dbResult,
    seededData: {
      users: getMockUsers().map((u) => ({ name: u.name, email: u.email, role: u.role })),
      tableCount: getMockTables().length,
      menuItemCount: getMockMenuItems().length,
    },
    demoCredentials: [
      { role: "ADMIN", email: "admin@terracottacafe.com", password: "admin123" },
      { role: "EMPLOYEE", email: "staff@terracottacafe.com", password: "staff123" },
      { role: "EMPLOYEE", email: "chef@terracottacafe.com", password: "chef123" },
    ],
  });
}
