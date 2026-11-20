"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useOrder } from "@/context/OrderContext";
import { IMenuItem } from "@/types";
import { Plus, Minus, Search, Edit3, Trash2, Clock, Coffee, ShoppingBag, ArrowRight } from "lucide-react";

export function MenuCatalog() {
  const { data: session } = useSession();
  const { menuItems, cart, addToCart, updateQuantity, selectedTable, refreshMenu, setIsCartOpen, cartTotal } = useOrder();
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // Form states for creating/editing menu item
  const [formData, setFormData] = useState({
    name: "",
    category: "Coffee",
    price: 0,
    costPrice: 0,
    description: "",
    isAvailable: true,
    preparationTimeMinutes: 10,
  });

  const userRole = (session?.user as any)?.role;
  const canEditMenu = userRole === "ADMIN" || userRole === "EMPLOYEE";

  const categories = [
    "ALL",
    "Coffee",
    "Tea & Beverages",
    "Bakery & Desserts",
    "Artisanal Mains",
    "Sides & Quick Bites",
  ];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenEdit = (item: IMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      costPrice: item.costPrice || 0,
      description: item.description,
      isAvailable: item.isAvailable,
      preparationTimeMinutes: item.preparationTimeMinutes || 10,
    });
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item
        const res = await fetch("/api/menu", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: editingItem._id, ...formData }),
        });
        if (res.ok) {
          setEditingItem(null);
          await refreshMenu();
        }
      } else {
        // Create new item
        const res = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setIsNewItemModalOpen(false);
          await refreshMenu();
        }
      }
    } catch (err) {
      console.error("Failed to save menu item", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshMenu();
      } else {
        const data = await res.json();
        alert(data.error || "Cannot delete item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Table Context Notice */}
      {selectedTable ? (
        <div className="flex items-center justify-between rounded-2xl border border-cafe-border bg-cafe-peach p-4 shadow-cafe-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-primary text-cafe-surface">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-cafe-accent">
                Active Order Target
              </p>
              <h3 className="font-serif text-lg font-bold text-cafe-primary">
                Table {selectedTable.tableNumber}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-cafe-text/80 bg-cafe-cream px-3 py-1.5 rounded-xl border border-cafe-border">
              Add multiple items without opening bill
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-4 text-center">
          <p className="text-sm font-semibold text-cafe-accent">
            Please select a table above to start an order, or browse the menu below.
          </p>
        </div>
      )}

      {/* Header, Search & Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cafe-accent" />
            <input
              type="text"
              placeholder="Search handcrafted coffee, pastries, mains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-cafe-border bg-cafe-cream pl-10 pr-4 py-2 text-sm text-cafe-text placeholder-cafe-text/40 focus:border-cafe-primary focus:outline-none"
            />
          </div>

          {canEditMenu && (
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: "",
                  category: "Coffee",
                  price: 0,
                  costPrice: 0,
                  description: "",
                  isAvailable: true,
                  preparationTimeMinutes: 10,
                });
                setIsNewItemModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-cafe-primary px-4 py-2 text-xs font-semibold text-cafe-surface shadow-cafe-sm hover:bg-cafe-accent transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Menu Item</span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-cafe-primary text-cafe-surface shadow-cafe-sm"
                  : "bg-cafe-cream border border-cafe-border text-cafe-text hover:bg-cafe-peach"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => {
          const cartItem = cart.find((ci) => ci.menuItemId === item._id);
          const count = cartItem ? cartItem.quantity : 0;

          return (
            <div
              key={item._id}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                item.isAvailable
                  ? count > 0
                    ? "border-cafe-primary/60 bg-cafe-cream shadow-cafe-sm ring-1 ring-cafe-primary/20"
                    : "border-cafe-border bg-cafe-cream hover:border-cafe-accent hover:shadow-cafe-sm"
                  : "border-cafe-border/50 bg-cafe-cream/60 opacity-60"
              }`}
            >
              <div>
                {/* Category tag & Item Count Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-full bg-cafe-peach px-2.5 py-0.5 text-[10px] font-bold text-cafe-primary border border-cafe-border">
                    {item.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {count > 0 && (
                      <span className="rounded-full bg-cafe-primary text-cafe-surface px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                        {count} in bill
                      </span>
                    )}

                    {canEditMenu && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Item Details"
                          className="p-1 text-cafe-accent hover:text-cafe-primary rounded-md"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {userRole === "ADMIN" && (
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            title="Delete Item"
                            className="p-1 text-rose-500 hover:text-rose-700 rounded-md"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <h4 className="font-serif text-lg font-bold text-cafe-text group-hover:text-cafe-primary transition-colors">
                  {item.name}
                </h4>
                <p className="mt-1 text-xs text-cafe-text/70 line-clamp-2">
                  {item.description || "Artisanal specialty crafted with fresh local ingredients."}
                </p>

                {/* Prep time */}
                {item.preparationTimeMinutes && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-cafe-accent">
                    <Clock className="h-3 w-3" />
                    <span>{item.preparationTimeMinutes} mins prep</span>
                  </div>
                )}
              </div>

              {/* Price & Add to Cart Action */}
              <div className="mt-4 flex items-center justify-between border-t border-cafe-border/70 pt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cafe-text/60">Price</span>
                  <p className="font-serif text-lg font-bold text-cafe-primary">
                    ₹{item.price}
                  </p>
                </div>

                {/* If item not in bill, show Add button. If in bill, show Quantity Stepper */}
                {count === 0 ? (
                  <button
                    disabled={!item.isAvailable || !selectedTable}
                    onClick={() => addToCart(item)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      !selectedTable
                        ? "bg-cafe-border text-cafe-text/40 cursor-not-allowed"
                        : !item.isAvailable
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-cafe-primary text-cafe-surface hover:bg-cafe-accent shadow-cafe-sm active:scale-95"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{selectedTable ? "Add" : "Select Table"}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-xl bg-cafe-peach border border-cafe-border p-1 shadow-sm">
                    <button
                      onClick={() => updateQuantity(item._id, -1)}
                      title="Decrease quantity"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-cafe-surface text-cafe-primary hover:bg-rose-50 hover:text-rose-700 transition-colors shadow-sm font-bold"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <span className="min-w-[24px] text-center text-xs font-bold text-cafe-primary">
                      {count}
                    </span>

                    <button
                      onClick={() => updateQuantity(item._id, 1)}
                      title="Increase quantity"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-cafe-primary text-cafe-surface hover:bg-cafe-accent transition-colors shadow-sm font-bold"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar when items are selected */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl animate-bounce-subtle">
          <div className="flex items-center justify-between rounded-2xl border border-cafe-border bg-cafe-surface/95 backdrop-blur-md px-5 py-3 shadow-cafe-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-primary text-cafe-surface">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-cafe-primary">
                  {selectedTable ? `Table ${selectedTable.tableNumber}` : "Selected Items"}: {totalCartCount} item{totalCartCount > 1 ? "s" : ""}
                </p>
                <p className="text-[11px] font-semibold text-cafe-text/70">
                  Subtotal: <span className="font-bold text-cafe-primary">₹{cartTotal}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-cafe-primary px-5 py-2.5 text-xs font-bold text-cafe-surface shadow-cafe-md hover:bg-cafe-accent transition-all"
            >
              <span>View Bill & Kitchen Ticket</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Menu Item (Staff & Admin) */}
      {(isNewItemModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cafe-border bg-cafe-surface p-6 shadow-cafe-lg">
            <h3 className="font-serif text-xl font-bold text-cafe-primary mb-1">
              {editingItem ? "Edit Menu Item" : "Create Artisan Item"}
            </h3>
            <p className="text-xs text-cafe-text/70 mb-4">
              Update recipe, pricing, and availability
            </p>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cafe-text mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-cafe-border bg-cafe-cream px-3 py-2 text-sm text-cafe-text focus:border-cafe-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cafe-text mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-xl border border-cafe-border bg-cafe-cream px-3 py-2 text-sm text-cafe-text focus:border-cafe-primary focus:outline-none"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Tea & Beverages">Tea & Beverages</option>
                    <option value="Bakery & Desserts">Bakery & Desserts</option>
                    <option value="Artisanal Mains">Artisanal Mains</option>
                    <option value="Sides & Quick Bites">Sides & Quick Bites</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-cafe-text mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-cafe-border bg-cafe-cream px-3 py-2 text-sm text-cafe-text focus:border-cafe-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cafe-text mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-cafe-border bg-cafe-cream px-3 py-2 text-sm text-cafe-text focus:border-cafe-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cafe-text mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.preparationTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, preparationTimeMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-cafe-border bg-cafe-cream px-3 py-2 text-sm text-cafe-text focus:border-cafe-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cafe-text mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-cafe-border bg-cafe-cream px-3 py-2 text-sm text-cafe-text focus:border-cafe-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 rounded text-cafe-primary focus:ring-cafe-accent"
                />
                <label htmlFor="isAvailable" className="text-xs font-semibold text-cafe-text">
                  Item is currently in stock & available to order
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cafe-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewItemModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-cafe-text hover:bg-cafe-peach"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cafe-primary px-5 py-2 text-xs font-semibold text-cafe-surface hover:bg-cafe-accent"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
