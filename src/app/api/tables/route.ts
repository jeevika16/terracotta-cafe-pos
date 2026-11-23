import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Table from "@/models/Table";
import { getDbTables, createDbTable, updateDbTable } from "@/lib/persistentDb";

// GET all tables
export async function GET() {
  try {
    const db = await connectDB();
    if (db) {
      try {
        const tables = await Table.find().sort({ tableNumber: 1 });
        return NextResponse.json(tables || []);
      } catch (err: any) {
        console.warn("MongoDB query tables notice:", err?.message);
      }
    }

    return NextResponse.json(getDbTables() || []);
  } catch (error: any) {
    console.error("GET /api/tables error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch tables" }, { status: 500 });
  }
}

// POST create table
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json(
        { error: "Unauthorized: Staff permission required to manage tables" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tableNumber, capacity, section } = body;

    if (!tableNumber || String(tableNumber).trim() === "") {
      return NextResponse.json({ error: "Table number is required" }, { status: 400 });
    }

    const cleanTableNum = String(tableNumber).trim();
    let createdTable: any = null;

    const db = await connectDB();
    if (db) {
      try {
        const existing = await Table.findOne({ tableNumber: cleanTableNum });
        if (existing) {
          return NextResponse.json(
            { error: `Table ${cleanTableNum} already exists in database` },
            { status: 400 }
          );
        }

        createdTable = await Table.create({
          tableNumber: cleanTableNum,
          capacity: capacity || 4,
          section: section || "Main Area",
          status: "AVAILABLE",
        });
      } catch (dbErr: any) {
        console.warn("MongoDB create table notice:", dbErr?.message);
      }
    }

    try {
      const persisted = createDbTable({
        tableNumber: cleanTableNum,
        capacity: capacity || 4,
        section: section || "Main Area",
      });
      if (!createdTable) createdTable = persisted;
    } catch (e: any) {
      if (!createdTable) return NextResponse.json({ error: e.message }, { status: 400 });
    }

    return NextResponse.json(createdTable, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update table
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Unauthorized: Staff permission required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, _id, ...updates } = body;
    const tableId = id || _id;

    if (!tableId) {
      return NextResponse.json({ error: "Table ID is required" }, { status: 400 });
    }

    let updatedTable: any = null;

    const db = await connectDB();
    if (db) {
      try {
        updatedTable = await Table.findByIdAndUpdate(tableId, updates, { new: true });
      } catch (dbErr: any) {
        console.warn("MongoDB update table notice:", dbErr?.message);
      }
    }

    const persisted = updateDbTable(tableId, updates);
    if (!updatedTable) updatedTable = persisted;

    if (!updatedTable) {
      return NextResponse.json({ error: "Table not found in database" }, { status: 404 });
    }

    return NextResponse.json(updatedTable);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE table
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin permission required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Table ID is required" }, { status: 400 });
    }

    const db = await connectDB();
    if (db) {
      await Table.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true, message: "Table deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
