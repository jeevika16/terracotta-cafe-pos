import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Table from "@/models/Table";
import { getMockTables, addMockTable, updateMockTable } from "@/lib/mockData";

// GET all tables
export async function GET() {
  try {
    const db = await connectDB();
    if (db) {
      const tables = await Table.find().sort({ tableNumber: 1 });
      if (tables && tables.length > 0) {
        return NextResponse.json(tables);
      }
    }
  } catch (error: any) {
    console.warn("DB fetch tables error, using mock fallback:", error?.message);
  }

  // Graceful fallback to mock data
  return NextResponse.json(getMockTables());
}

// POST create table (Admin & Employee only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json(
        { error: "Unauthorized: Only Staff or Admin can manage tables" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tableNumber, capacity, section } = body;

    if (!tableNumber) {
      return NextResponse.json({ error: "Table number is required" }, { status: 400 });
    }

    const db = await connectDB();
    if (db) {
      try {
        const existing = await Table.findOne({ tableNumber });
        if (existing) {
          return NextResponse.json({ error: `Table ${tableNumber} already exists` }, { status: 400 });
        }

        const newTable = await Table.create({
          tableNumber,
          capacity: capacity || 4,
          section: section || "Courtyard Terrace",
          status: "AVAILABLE",
        });

        // Also sync to mock store
        try {
          addMockTable({ tableNumber, capacity, section });
        } catch (_) {}

        return NextResponse.json(newTable, { status: 201 });
      } catch (dbErr: any) {
        console.warn("MongoDB create table error, falling back to mock:", dbErr?.message);
      }
    }

    // Fallback: Add to mock store
    try {
      const mockTable = addMockTable({ tableNumber, capacity, section });
      return NextResponse.json(mockTable, { status: 201 });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update table (status, capacity, section)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    const db = await connectDB();
    if (db) {
      try {
        const updated = await Table.findByIdAndUpdate(id, updates, { new: true });
        if (updated) {
          updateMockTable(id, updates);
          return NextResponse.json(updated);
        }
      } catch (dbErr: any) {
        console.warn("MongoDB patch table error, falling back to mock:", dbErr?.message);
      }
    }

    // Mock store update
    const updatedMock = updateMockTable(id, updates);
    if (!updatedMock) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    return NextResponse.json(updatedMock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
