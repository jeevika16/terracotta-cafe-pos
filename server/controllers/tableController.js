const Table = require("../models/Table");

// GET /api/tables - Fetch all tables
async function getTables(req, res) {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    return res.status(200).json(tables || []);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch tables" });
  }
}

// POST /api/tables - Create a new table
async function createTable(req, res) {
  try {
    const { tableNumber, capacity, section } = req.body;

    if (!tableNumber || String(tableNumber).trim() === "") {
      return res.status(400).json({ error: "Table number is required" });
    }

    const cleanTableNum = String(tableNumber).trim();
    const existing = await Table.findOne({ tableNumber: cleanTableNum });
    if (existing) {
      return res.status(400).json({ error: `Table ${cleanTableNum} already exists in database` });
    }

    const newTable = await Table.create({
      tableNumber: cleanTableNum,
      capacity: capacity ? Number(capacity) : 4,
      section: section || "Main Area",
      status: "AVAILABLE",
    });

    return res.status(201).json(newTable);
  } catch (error) {
    console.error("Error creating table:", error);
    return res.status(500).json({ error: error.message || "Failed to create table" });
  }
}

// PATCH /api/tables - Update table status or capacity
async function updateTable(req, res) {
  try {
    const { id, _id, ...updates } = req.body;
    const tableId = id || _id;

    if (!tableId) {
      return res.status(400).json({ error: "Table ID is required" });
    }

    const updatedTable = await Table.findByIdAndUpdate(tableId, updates, { new: true });
    if (!updatedTable) {
      return res.status(404).json({ error: "Table not found in database" });
    }

    return res.status(200).json(updatedTable);
  } catch (error) {
    console.error("Error updating table:", error);
    return res.status(500).json({ error: error.message || "Failed to update table" });
  }
}

// DELETE /api/tables/:id - Delete a table
async function deleteTable(req, res) {
  try {
    const tableId = req.params.id || req.query.id;
    if (!tableId) {
      return res.status(400).json({ error: "Table ID is required" });
    }

    const deleted = await Table.findByIdAndDelete(tableId);
    if (!deleted) {
      return res.status(404).json({ error: "Table not found" });
    }

    return res.status(200).json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    console.error("Error deleting table:", error);
    return res.status(500).json({ error: error.message || "Failed to delete table" });
  }
}

module.exports = {
  getTables,
  createTable,
  updateTable,
  deleteTable,
};
