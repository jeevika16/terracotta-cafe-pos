const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/users - Fetch all staff users
async function getUsers(req, res) {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    return res.status(200).json(users || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch users" });
  }
}

// POST /api/users - Create new staff account
async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Staff name is required" });
    }

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid work email address is required" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: `User with email "${normalizedEmail}" already exists in database` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "ADMIN" ? "ADMIN" : "EMPLOYEE";

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      active: true,
    });

    const safeUser = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      active: newUser.active,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: `Account for ${newUser.name} (${userRole}) saved to database successfully!`,
      user: safeUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: error.message || "Failed to create user" });
  }
}

// DELETE /api/users - Remove staff account
async function deleteUser(req, res) {
  try {
    const id = req.query.id || req.params.id;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found in database" });
    }

    return res.status(200).json({ success: true, message: "User account removed from database successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: error.message || "Failed to delete user" });
  }
}

module.exports = {
  getUsers,
  createUser,
  deleteUser,
};
