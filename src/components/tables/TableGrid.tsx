"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useOrder } from "@/context/OrderContext";
import { ITable, TableStatus } from "@/types";
import { Plus, Edit2, CheckCircle2, Clock, Coffee, AlertCircle } from "lucide-react";

export function TableGrid() {
  const { data: session } = useSession();
  const { tables, selectedTable, setSelectedTable, refreshTables } = useOrder();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [editingTable, setEditingTable] = useState<ITable | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<TableStatus>("AVAILABLE");

  const userRole = (session?.user as any)?.role;
  const canEdit = userRole === "ADMIN" || userRole === "EMPLOYEE";

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "OCCUPIED":
        return "bg-cafe-peach text-cafe-primary border-cafe-accent/40";
      case "RESERVED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "BILLING":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: newTableNumber.trim(),
          capacity: 4,
          section: "Main Area",
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setNewTableNumber("");
        await refreshTables();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add table");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (table: ITable, newStatus: TableStatus) => {
    try {
      const res = await fetch("/api/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: table._id, status: newStatus }),
      });
      if (res.ok) {
        setEditingTable(null);
        await refreshTables();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-cafe-border pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-cafe-primary">
            Floor Tables & Availability
          </h2>
          <p className="text-xs text-cafe-text/70 mt-0.5">
            Select a table to start an order or manage live dining availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Table Button (Admin/Employee only) */}
          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-cafe-primary px-4 py-2 text-xs font-semibold text-cafe-surface shadow-cafe-sm hover:bg-cafe-accent transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Table</span>
            </button>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {tables.map((table) => {
          const isSelected = selectedTable?._id === table._id;
          return (
            <div
              key={table._id}
              onClick={() => setSelectedTable(table)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-cafe-primary bg-cafe-peach/50 shadow-cafe-md ring-2 ring-cafe-primary/30"
                  : "border-cafe-border bg-cafe-cream hover:border-cafe-accent hover:shadow-cafe-sm"
              }`}
            >
              {/* Table Number & Status Edit Icon */}
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl font-bold text-cafe-primary">
                  T-{table.tableNumber}
                </span>

                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTable(table);
                      setStatusUpdate(table.status);
                    }}
                    title="Change Table Status"
                    className="p-1 text-cafe-accent hover:text-cafe-primary hover:bg-white/60 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Badge */}
              <div className="my-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${getStatusColor(
                    table.status
                  )}`}
                >
                  {table.status === "AVAILABLE" && <CheckCircle2 className="h-3 w-3" />}
                  {table.status === "OCCUPIED" && <Coffee className="h-3 w-3" />}
                  {table.status === "RESERVED" && <Clock className="h-3 w-3" />}
                  {table.status === "BILLING" && <AlertCircle className="h-3 w-3" />}
                  {table.status}
                </span>
              </div>

              {/* Status indicator description */}
              <div className="border-t border-cafe-border/60 pt-2 text-[11px] font-medium text-cafe-text/70">
                {table.status === "AVAILABLE" && <span className="text-emerald-700">Ready for Seating</span>}
                {table.status === "OCCUPIED" && <span className="text-cafe-primary font-bold">Active Service</span>}
                {table.status === "RESERVED" && <span className="text-amber-800">Reserved Guest</span>}
                {table.status === "BILLING" && <span className="text-purple-700">Settling Bill</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Table (Staff/Admin) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-cafe-border bg-cafe-surface p-6 shadow-cafe-lg">
            <h3 className="font-serif text-xl font-bold text-cafe-primary mb-1">
              Add New Table
            </h3>
            <p className="text-xs text-cafe-text/70 mb-4">
              Enter table number to add it to the floor plan
            </p>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cafe-text mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 09, 10, 11"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full rounded-xl border border-cafe-border bg-cafe-cream px-3.5 py-2.5 text-sm text-cafe-text focus:border-cafe-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cafe-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-cafe-text hover:bg-cafe-peach transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cafe-primary px-5 py-2 text-xs font-semibold text-cafe-surface hover:bg-cafe-accent transition-all shadow-cafe-sm"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Edit Status */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-cafe-border bg-cafe-surface p-5 shadow-cafe-lg">
            <h3 className="font-serif text-lg font-bold text-cafe-primary mb-1">
              Table {editingTable.tableNumber} Status
            </h3>
            <p className="text-xs text-cafe-text/70 mb-4">
              Update table availability or dining state
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["AVAILABLE", "OCCUPIED", "RESERVED", "BILLING"] as TableStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(editingTable, st)}
                  className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    editingTable.status === st
                      ? "border-cafe-primary bg-cafe-primary text-cafe-surface"
                      : "border-cafe-border bg-cafe-cream text-cafe-text hover:bg-cafe-peach"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={() => setEditingTable(null)}
              className="w-full rounded-xl bg-cafe-cream py-2 text-xs font-semibold text-cafe-text border border-cafe-border hover:bg-cafe-peach transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
