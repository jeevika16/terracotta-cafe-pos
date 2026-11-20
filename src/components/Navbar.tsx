"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Coffee,
  LayoutGrid,
  BarChart3,
  ShoppingBag,
  LogIn,
  LogOut,
  ShieldCheck,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Check,
} from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { useKitchenNotification } from "@/components/notifications/KitchenNotificationProvider";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { cart, setIsCartOpen, selectedTable } = useOrder();
  const { isConnected, notifications, unreadCount, markAllRead, isMuted, setIsMuted } = useKitchenNotification();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const userRole = (session?.user as any)?.role;
  const isStaffOrAdmin = userRole === "ADMIN" || userRole === "EMPLOYEE";

  return (
    <header className="sticky top-0 z-40 border-b border-cafe-border bg-cafe-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-primary text-cafe-surface shadow-cafe-sm transition-transform group-hover:scale-105">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight text-cafe-primary">
              TERRACOTTA
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-cafe-accent font-semibold -mt-1">
              Artisan Cafe & POS
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-cafe-cream/80 p-1 rounded-xl border border-cafe-border">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === "/"
                ? "bg-cafe-primary text-cafe-surface shadow-sm"
                : "text-cafe-text hover:text-cafe-primary hover:bg-cafe-peach/50"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Floor Tables & Menu</span>
          </Link>

          {/* Admin Dashboard - visible only to Admin */}
          {userRole === "ADMIN" && (
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/dashboard")
                  ? "bg-cafe-primary text-cafe-surface shadow-sm"
                  : "text-cafe-text hover:text-cafe-primary hover:bg-cafe-peach/50"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Admin Portal</span>
              <span className="text-[10px] bg-cafe-accent text-white px-1.5 py-0.2 rounded-full font-bold">Admin</span>
            </Link>
          )}
        </nav>

        {/* Right Action Area */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Real-time Kitchen WebSocket Indicator (for Staff & Admin) */}
          {isStaffOrAdmin && (
            <div className="relative">
              <div
                title={isConnected ? "WebSocket: Live Kitchen Stream Connected" : "Connecting to Kitchen Stream..."}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-cafe-border bg-cafe-cream px-2 py-1 text-[11px] font-semibold text-cafe-text/80"
              >
                <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                <span>Kitchen Sync</span>
              </div>
            </div>
          )}

          {/* Kitchen Orders Notification Bell (for Staff & Admin) */}
          {isStaffOrAdmin && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  if (!isNotifDropdownOpen) markAllRead();
                }}
                title="Kitchen Order Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cafe-border bg-cafe-cream text-cafe-primary hover:bg-cafe-peach transition-all shadow-cafe-sm"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cafe-accent text-[9px] font-bold text-white shadow-sm animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-cafe-border bg-cafe-surface p-3 shadow-cafe-lg z-50 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-cafe-border pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cafe-peach text-cafe-primary">
                        <Bell className="h-3 w-3" />
                      </span>
                      <h4 className="text-xs font-bold text-cafe-primary">
                        Kitchen Order Feed
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        title={isMuted ? "Unmute chime" : "Mute chime"}
                        className="text-cafe-accent hover:text-cafe-primary p-0.5 rounded"
                      >
                        {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setIsNotifDropdownOpen(false)}
                        className="text-xs text-cafe-text/50 hover:text-cafe-primary"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-cafe-text/60">
                        No orders received yet today.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl border border-cafe-border bg-cafe-cream/80 p-2.5 text-xs space-y-1 hover:bg-cafe-peach/30 transition-colors"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="rounded bg-cafe-peach px-1.5 py-0.5 text-[10px] text-cafe-primary">
                              Table {n.order?.tableNumber || "?"}
                            </span>
                            <span className="text-[10px] text-cafe-text/60">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-cafe-text">
                            {n.message}
                          </p>
                          {n.order?.items && (
                            <div className="text-[10px] text-cafe-text/70 bg-white/60 p-1.5 rounded-lg border border-cafe-border/50">
                              {n.order.items.map((it, i) => (
                                <div key={i}>
                                  {it.quantity}x {it.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Table indicator if selected */}
          {selectedTable && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-cafe-peach border border-cafe-border">
              <span className="h-2 w-2 rounded-full bg-cafe-accent animate-pulse" />
              <span className="text-xs font-semibold text-cafe-primary">
                Table {selectedTable.tableNumber}
              </span>
            </div>
          )}

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 rounded-xl border border-cafe-border bg-cafe-cream px-3.5 py-2 text-sm font-medium text-cafe-primary transition-all hover:border-cafe-accent hover:shadow-cafe-sm"
          >
            <ShoppingBag className="h-4 w-4 text-cafe-accent" />
            <span className="hidden sm:inline font-semibold">Active Bill</span>
            {totalCartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cafe-primary text-[11px] font-bold text-cafe-surface">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Auth State */}
          {session ? (
            <div className="flex items-center gap-2 pl-2 border-l border-cafe-border">
              <div className="hidden text-right lg:block">
                <p className="text-xs font-bold text-cafe-text">{session.user?.name}</p>
                <p className="text-[10px] font-semibold text-cafe-accent uppercase tracking-wider flex items-center justify-end gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {userRole}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="p-2 text-cafe-accent hover:text-cafe-primary hover:bg-cafe-peach rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl bg-cafe-peach px-3 py-2 text-xs font-bold text-cafe-primary border border-cafe-border hover:bg-cafe-border transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Staff Login</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
