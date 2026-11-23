"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useOrder } from "@/context/OrderContext";
import { X, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, QrCode, CheckCircle2, Receipt } from "lucide-react";
import { PaymentMethod } from "@/types";
import { apiUrl } from "@/lib/api";

export function CartDrawer() {
  const { data: session } = useSession();
  const {
    isCartOpen,
    setIsCartOpen,
    selectedTable,
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    activeOrder,
    refreshTables,
  } = useOrder();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role;
  const isStaff = userRole === "ADMIN" || userRole === "EMPLOYEE";

  if (!isCartOpen) return null;

  // Handler for placing a new order (Guest, Employee, or Admin)
  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      alert("Please select a table first");
      return;
    }
    if (cart.length === 0) {
      alert("Please add items to your bill");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: selectedTable._id,
          tableNumber: selectedTable.tableNumber,
          items: cart.map((ci) => ({
            menuItemId: ci.menuItemId,
            name: ci.name,
            price: ci.price,
            costPrice: ci.costPrice,
            quantity: ci.quantity,
            subtotal: ci.price * ci.quantity,
            notes: ci.notes,
          })),
          subtotal: cartSubtotal,
          tax: cartTax,
          discount: 0,
          total: cartTotal,
        }),
      });

      if (res.ok) {
        clearCart();
        setSuccessMessage(`Order placed successfully for Table ${selectedTable.tableNumber}!`);
        await refreshTables();
        setTimeout(() => {
          setSuccessMessage(null);
          setIsCartOpen(false);
        }, 1800);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for settling payment and closing active order (Staff/Admin only)
  const handleSettleBill = async () => {
    if (!activeOrder) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(apiUrl("/api/orders"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder._id,
          action: "SETTLE_PAYMENT",
          paymentMethod,
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Bill settled via ${paymentMethod}! Table is now free.`);
        await refreshTables();
        setTimeout(() => {
          setSuccessMessage(null);
          setIsCartOpen(false);
        }, 1800);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to settle bill");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-cafe-border bg-cafe-surface p-6 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between border-b border-cafe-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cafe-peach text-cafe-primary">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-cafe-primary">
                    {selectedTable ? `Table ${selectedTable.tableNumber}` : "Order Ticket"}
                  </h3>
                  <p className="text-[11px] text-cafe-text/60">
                    {selectedTable?.section || "No table selected"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-lg p-1.5 text-cafe-text/60 hover:bg-cafe-peach hover:text-cafe-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success notification */}
            {successMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Active Table Order Info (if occupied) */}
            {activeOrder && (
              <div className="mt-4 rounded-xl border border-cafe-border bg-cafe-peach/50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cafe-primary">Existing Active Order</span>
                  <span className="rounded-full bg-cafe-accent text-white px-2 py-0.5 text-[10px] font-bold">
                    {activeOrder.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {activeOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-cafe-text/80">
                      <span>{it.quantity}x {it.name}</span>
                      <span className="font-medium">₹{it.subtotal}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between border-t border-cafe-border pt-1.5 text-xs font-bold text-cafe-text">
                  <span>Current Bill Total:</span>
                  <span className="text-cafe-primary">₹{activeOrder.total}</span>
                </div>
              </div>
            )}

            {/* Newly Added Cart Items */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cafe-accent mb-2">
                Items in Cart ({cart.length})
              </h4>

              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-cafe-border p-6 text-center text-xs text-cafe-text/50">
                  <ShoppingBag className="mx-auto h-8 w-8 text-cafe-border mb-2" />
                  No items added yet. Select items from the menu to populate this ticket.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
                  {cart.map((ci) => (
                    <div
                      key={ci.menuItemId}
                      className="flex items-center justify-between rounded-xl border border-cafe-border bg-cafe-cream p-2.5"
                    >
                      <div className="flex-1 pr-2">
                        <p className="text-xs font-bold text-cafe-text">{ci.name}</p>
                        <p className="text-[11px] text-cafe-accent font-semibold">
                          ₹{ci.price} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quantity controls */}
                        <div className="flex items-center rounded-lg border border-cafe-border bg-cafe-surface">
                          <button
                            onClick={() => updateQuantity(ci.menuItemId, -1)}
                            className="p-1 hover:text-cafe-primary"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-cafe-text">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(ci.menuItemId, 1)}
                            className="p-1 hover:text-cafe-primary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="w-12 text-right text-xs font-bold text-cafe-text">
                          ₹{ci.price * ci.quantity}
                        </span>

                        <button
                          onClick={() => removeFromCart(ci.menuItemId)}
                          className="p-1 text-rose-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer & Actions */}
          <div className="border-t border-cafe-border pt-4 space-y-4">
            {/* Calculation summary */}
            <div className="space-y-1.5 text-xs text-cafe-text/80">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST / Taxes (5%):</span>
                <span className="font-semibold">₹{cartTax}</span>
              </div>
              <div className="flex justify-between border-t border-cafe-border/70 pt-2 font-serif text-base font-bold text-cafe-primary">
                <span>Total Payable:</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            {/* If Cart has items: Show Place Order */}
            {cart.length > 0 && (
              <button
                disabled={isSubmitting || !selectedTable}
                onClick={handlePlaceOrder}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cafe-primary py-3 text-sm font-bold text-cafe-surface shadow-cafe-md hover:bg-cafe-accent disabled:opacity-50 transition-all"
              >
                <span>{isSubmitting ? "Placing..." : "Confirm & Send to Kitchen"}</span>
              </button>
            )}

            {/* If Table has active order and user is Staff: Allow Settlement */}
            {activeOrder && isStaff && (
              <div className="space-y-3 pt-2 border-t border-cafe-border">
                <p className="text-xs font-bold text-cafe-text">Select Settlement Method:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["UPI", "CASH", "CARD"] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-all ${
                        paymentMethod === method
                          ? "border-cafe-primary bg-cafe-peach text-cafe-primary"
                          : "border-cafe-border bg-cafe-cream text-cafe-text hover:bg-cafe-peach/50"
                      }`}
                    >
                      {method === "UPI" && <QrCode className="h-4 w-4" />}
                      {method === "CASH" && <Banknote className="h-4 w-4" />}
                      {method === "CARD" && <CreditCard className="h-4 w-4" />}
                      <span>{method}</span>
                    </button>
                  ))}
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={handleSettleBill}
                  className="w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition-all"
                >
                  {isSubmitting ? "Settling..." : `Settle Bill (₹${activeOrder.total}) & Clear Table`}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
