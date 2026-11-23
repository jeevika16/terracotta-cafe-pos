import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import {
  getDbMenuItems,
  createDbMenuItem,
  updateDbMenuItem,
  deleteDbMenuItem,
} from "@/lib/persistentDb";

// GET all menu items
export async function GET() {
  try {
    const db = await connectDB();
    if (db) {
      try {
        const items = await MenuItem.find().sort({ category: 1, name: 1 });
        return NextResponse.json(items || []);
      } catch (err: any) {
        console.warn("MongoDB query menu notice:", err?.message);
      }
    }

    return NextResponse.json(getDbMenuItems() || []);
  } catch (error: any) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch menu" }, { status: 500 });
  }
}

// POST create menu item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Unauthorized: Staff permission required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, price } = body;

    if (!name || !category || typeof price !== "number") {
      return NextResponse.json(
        { error: "Item name, category, and valid price are required" },
        { status: 400 }
      );
    }

    let createdItem: any = null;

    const db = await connectDB();
    if (db) {
      try {
        createdItem = await MenuItem.create(body);
      } catch (dbErr: any) {
        console.warn("MongoDB create menu notice:", dbErr?.message);
      }
    }

    const persisted = createDbMenuItem(body);
    if (!createdItem) createdItem = persisted;

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update menu item
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Unauthorized: Staff permission required" }, { status: 403 });
    }

    const body = await req.json();
    const { _id, id, ...updates } = body;
    const itemId = _id || id;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    let updatedItem: any = null;

    const db = await connectDB();
    if (db) {
      try {
        updatedItem = await MenuItem.findByIdAndUpdate(itemId, updates, { new: true });
      } catch (dbErr: any) {
        console.warn("MongoDB update menu notice:", dbErr?.message);
      }
    }

    const persisted = updateDbMenuItem(itemId, updates);
    if (!updatedItem) updatedItem = persisted;

    if (!updatedItem) {
      return NextResponse.json({ error: "Menu item not found in database" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE menu item
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin permission required to delete menu items" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const db = await connectDB();
    if (db) {
      try {
        await MenuItem.findByIdAndDelete(id);
      } catch (dbErr: any) {
        console.warn("MongoDB delete menu notice:", dbErr?.message);
      }
    }

    deleteDbMenuItem(id);

    return NextResponse.json({ success: true, message: "Item deleted from database successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
