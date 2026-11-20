"use client";

import React, { useState } from "react";
import { TableGrid } from "@/components/tables/TableGrid";
import { MenuCatalog } from "@/components/menu/MenuCatalog";
import { CartDrawer } from "@/components/order/CartDrawer";
import { LayoutGrid, UtensilsCrossed } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"TABLES" | "MENU">("TABLES");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Mobile view switchers */}
      <div className="flex md:hidden items-center justify-center mb-6">
        <div className="flex items-center gap-1 rounded-xl border border-cafe-border bg-cafe-cream p-1">
          <button
            onClick={() => setActiveTab("TABLES")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "TABLES"
                ? "bg-cafe-primary text-cafe-surface shadow-sm"
                : "text-cafe-text"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Tables</span>
          </button>
          <button
            onClick={() => setActiveTab("MENU")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "MENU"
                ? "bg-cafe-primary text-cafe-surface shadow-sm"
                : "text-cafe-text"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Artisan Menu</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="space-y-10">
        {/* Table Management & Selection */}
        <div className={activeTab === "MENU" ? "hidden md:block" : "block"}>
          <TableGrid />
        </div>

        {/* Dynamic Menu & Ordering */}
        <div className={activeTab === "TABLES" ? "hidden md:block border-t border-cafe-border pt-8" : "block"}>
          <MenuCatalog />
        </div>
      </div>

      {/* Slide-out Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
