import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getMockUsers, addMockUser, deleteMockUser, findMockUserByEmail } from "@/lib/mockData";

// GET all users (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentRole = (session?.user as any)?.role;

    if (!session || currentRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required to manage staff accounts" },
        { status: 403 }
      );
    }

    const db = await connectDB();
    if (db) {
      try {
        const dbUsers = await User.find({}, "-password").sort({ createdAt: -1 });
        if (dbUsers && dbUsers.length > 0) {
          return NextResponse.json(dbUsers);
        }
      } catch (err: any) {
        console.warn("Error fetching users from DB, falling back to mock users:", err?.message);
      }
    }

    // Mock store users without passwords
    const safeMockUsers = getMockUsers().map(({ password, ...rest }) => rest);
    return NextResponse.json(safeMockUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new user (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentRole = (session?.user as any)?.role;

    if (!session || currentRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin can create new staff accounts" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Staff name is required" }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid work email address is required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const userRole = role === "ADMIN" ? "ADMIN" : "EMPLOYEE";
    const normalizedEmail = email.trim().toLowerCase();

    const db = await connectDB();
    let createdUser: any = null;

    if (db) {
      try {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return NextResponse.json(
            { error: `User with email "${normalizedEmail}" already exists` },
            { status: 400 }
          );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: userRole,
          active: true,
        });

        createdUser = {
          _id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          active: newUser.active,
          createdAt: newUser.createdAt,
        };
      } catch (dbErr: any) {
        console.warn("MongoDB create user error:", dbErr?.message);
      }
    }

    // Sync to mock store so login works even if DB is in mock mode
    try {
      const mockResult = await addMockUser({
        name: name.trim(),
        email: normalizedEmail,
        password: password,
        role: userRole,
      });

      if (!createdUser) {
        const { password: _, ...safeMock } = mockResult;
        createdUser = safeMock;
      }
    } catch (mockErr: any) {
      if (!createdUser) {
        return NextResponse.json({ error: mockErr.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Account for ${createdUser.name} (${userRole}) created successfully!`,
        user: createdUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE user (Admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentRole = (session?.user as any)?.role;
    const currentUserId = (session?.user as any)?.id;

    if (!session || currentRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (id === currentUserId) {
      return NextResponse.json({ error: "Cannot delete your own active administrator account" }, { status: 400 });
    }

    const db = await connectDB();
    if (db) {
      try {
        await User.findByIdAndDelete(id);
      } catch (err: any) {
        console.warn("DB user delete error:", err?.message);
      }
    }

    deleteMockUser(id);

    return NextResponse.json({ success: true, message: "User account removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
