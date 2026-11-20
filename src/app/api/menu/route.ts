import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import {
  getMockMenuItems,
  addMockMenuItem,
  updateMockMenuItem,
  deleteMockMenuItem,
} from "@/lib/mockData";

// GET all menu items (Public)
export async function GET() {
  try {
    const db = await connectDB();
    if (db) {
      const items = await MenuItem.find().sort({ category: 1, name: 1 });
      if (items && items.length > 0) {
        return NextResponse.json(items);
      }
    }
  } catch (error: any) {
    console.warn("DB fetch menu error, using mock fallback:", error?.message);
  }

  // Graceful fallback to handcrafted mock menu
  return NextResponse.json(getMockMenuItems());
}

// POST create menu item (Admin & Employee only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Unauthorized: Staff permission required" }, { status: 403 });
    }

    const body = await req.json();
    const db = await connectDB();

    if (db) {
      try {
        const item = await MenuItem.create(body);
        try {
          addMockMenuItem(body);
        } catch (_) {}
        return NextResponse.json(item, { status: 201 });
      } catch (dbErr: any) {
        console.warn("MongoDB create menu item error, using mock fallback:", dbErr?.message);
      }
    }

    // Mock store
    const mockItem = addMockMenuItem(body);
    return NextResponse.json(mockItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update menu item (Admin & Employee only)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json({ error: "Unauthorized: Staff permission required" }, { status: 403 });
    }

    const body = await req.json();
    const { _id, ...updates } = body;
    const db = await connectDB();

    if (db) {
      try {
        const updated = await MenuItem.findByIdAndUpdate(_id, updates, { new: true });
        if (updated) {
          updateMockMenuItem(_id, updates);
          return NextResponse.json(updated);
        }
      } catch (dbErr: any) {
        console.warn("MongoDB update menu item error, using mock fallback:", dbErr?.message);
      }
    }

    // Mock store
    const updatedMock = updateMockMenuItem(_id, updates);
    if (!updatedMock) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }
    return NextResponse.json(updatedMock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE menu item (Admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin permission required to delete" }, { status: 403 });
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
        console.warn("MongoDB delete menu item error:", dbErr?.message);
      }
    }

    deleteMockMenuItem(id);
    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
