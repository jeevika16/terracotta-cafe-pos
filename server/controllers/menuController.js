const MenuItem = require("../models/MenuItem");

// GET /api/menu - Fetch all menu items
async function getMenuItems(req, res) {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    return res.status(200).json(items || []);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch menu items" });
  }
}

// POST /api/menu - Create a new menu item
async function createMenuItem(req, res) {
  try {
    const { name, category, price, costPrice, description, imageUrl, isAvailable, preparationTimeMinutes } = req.body;

    if (!name || !category || typeof price !== "number") {
      return res.status(400).json({ error: "Item name, category, and valid price are required" });
    }

    const createdItem = await MenuItem.create({
      name: name.trim(),
      category,
      price: Number(price),
      costPrice: costPrice ? Number(costPrice) : 0,
      description: description || "",
      imageUrl: imageUrl || "",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      preparationTimeMinutes: preparationTimeMinutes ? Number(preparationTimeMinutes) : 10,
    });

    return res.status(201).json(createdItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return res.status(500).json({ error: error.message || "Failed to create menu item" });
  }
}

// PUT /api/menu - Update a menu item
async function updateMenuItem(req, res) {
  try {
    const { _id, id, ...updates } = req.body;
    const itemId = _id || id || req.params.id;

    if (!itemId) {
      return res.status(400).json({ error: "Menu item ID is required" });
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(itemId, updates, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ error: "Menu item not found in database" });
    }

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return res.status(500).json({ error: error.message || "Failed to update menu item" });
  }
}

// DELETE /api/menu - Delete a menu item
async function deleteMenuItem(req, res) {
  try {
    const id = req.query.id || req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Menu item not found in database" });
    }

    return res.status(200).json({ success: true, message: "Item deleted from database successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return res.status(500).json({ error: error.message || "Failed to delete menu item" });
  }
}

module.exports = {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
