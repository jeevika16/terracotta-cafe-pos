"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ITable, IMenuItem, ICartItem, IOrder, UserRole } from "@/types";
import { apiUrl } from "@/lib/api";

interface OrderContextType {
  selectedTable: ITable | null;
  setSelectedTable: (table: ITable | null) => void;
  cart: ICartItem[];
  addToCart: (item: IMenuItem, notes?: string) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  activeOrder: IOrder | null;
  setActiveOrder: (order: IOrder | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  refreshTables: () => Promise<void>;
  tables: ITable[];
  menuItems: IMenuItem[];
  refreshMenu: () => Promise<void>;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [selectedTable, setSelectedTable] = useState<ITable | null>(null);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<IOrder | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tables, setTables] = useState<ITable[]>([]);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tables and menu directly from backend API
  const refreshTables = async () => {
    try {
      const res = await fetch(apiUrl("/api/tables"));
      if (res.ok) {
        const data = await res.json();
        setTables(Array.isArray(data) ? data : []);
        if (selectedTable) {
          const updated = (Array.isArray(data) ? data : []).find((t: ITable) => t._id === selectedTable._id);
          if (updated) setSelectedTable(updated);
        }
      } else {
        console.error("Failed to fetch tables, status:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch tables", err);
    }
  };

  const refreshMenu = async () => {
    try {
      const res = await fetch(apiUrl("/api/menu"));
      if (res.ok) {
        const data = await res.json();
        setMenuItems(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch menu items, status:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch menu items", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoading(true);
      await Promise.allSettled([refreshTables(), refreshMenu()]);
      if (isMounted) {
        setIsLoading(false);
      }
    };
    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // When a table is selected, if it has an active order, fetch that order
  useEffect(() => {
    if (selectedTable?.currentOrderId) {
      fetch(apiUrl(`/api/orders?id=${selectedTable.currentOrderId}`))
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setActiveOrder(data);
          }
        })
        .catch((err) => console.error("Error fetching order:", err));
    } else {
      setActiveOrder(null);
    }
  }, [selectedTable]);

  const addToCart = (item: IMenuItem, notes?: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItemId === item._id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItemId === item._id
            ? { ...ci, quantity: ci.quantity + 1, notes: notes || ci.notes }
            : ci
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          costPrice: item.costPrice || 0,
          quantity: 1,
          notes: notes || "",
        },
      ];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItemId === menuItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as ICartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((acc, ci) => acc + ci.price * ci.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.05); // 5% GST/Service tax standard in cafe
  const cartTotal = cartSubtotal + cartTax;

  return (
    <OrderContext.Provider
      value={{
        selectedTable,
        setSelectedTable,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSubtotal,
        cartTax,
        cartTotal,
        activeOrder,
        setActiveOrder,
        isCartOpen,
        setIsCartOpen,
        refreshTables,
        tables,
        menuItems,
        refreshMenu,
        isLoading,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
