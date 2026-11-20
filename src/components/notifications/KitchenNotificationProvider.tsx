"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useOrder } from "@/context/OrderContext";
import { Bell, Volume2, VolumeX, X, Coffee, CheckCircle2, AlertTriangle, Radio } from "lucide-react";

export interface IKitchenNotification {
  id: string;
  type: string;
  message: string;
  order?: {
    _id?: string;
    tableId?: string;
    tableNumber?: string;
    items?: Array<{ name: string; quantity: number; price?: number }>;
    total?: number;
    placedByRole?: string;
    createdAt?: string;
  };
  timestamp: number;
}

interface KitchenNotificationContextType {
  isConnected: boolean;
  notifications: IKitchenNotification[];
  unreadCount: number;
  markAllRead: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

const KitchenNotificationContext = createContext<KitchenNotificationContextType | undefined>(undefined);

export function KitchenNotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { refreshTables } = useOrder();

  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<IKitchenNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<IKitchenNotification | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTimeRef = useRef<number>(Date.now());

  const userRole = (session?.user as any)?.role;
  const isStaffOrAdmin = userRole === "ADMIN" || userRole === "EMPLOYEE";

  // Play pleasant cafe kitchen bell chime using browser Web Audio API
  const playKitchenChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First chime tone (D5 - 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);

      // Second harmonizing tone (A5 - 880 Hz) with short delay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (_) {
      // Audio playback might be restricted if no user interaction yet
    }
  };

  const handleIncomingNotification = (notif: IKitchenNotification) => {
    // Only notify if newer than last processed or not a duplicate
    setNotifications((prev) => [notif, ...prev.slice(0, 24)]);
    setUnreadCount((c) => c + 1);

    // Refresh tables in floor plan immediately so occupancy is visible
    refreshTables().catch(() => {});

    // For staff and admin: trigger chime and toast banner
    if (isStaffOrAdmin && notif.type === "NEW_KITCHEN_ORDER") {
      playKitchenChime();
      setActiveToast(notif);

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
    }
  };

  // WebSocket Connection Management
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isCancelled = false;

    const connect = () => {
      if (isCancelled) return;

      const wsHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
      const wsPort = process.env.NEXT_PUBLIC_WS_PORT || "3001";
      const wsUrl = `ws://${wsHost}:${wsPort}`;

      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "NEW_KITCHEN_ORDER" || data.type === "ORDER_SETTLED") {
              const notif: IKitchenNotification = {
                id: data.id || `ws_${Date.now()}_${Math.random()}`,
                type: data.type,
                message: data.message || `Order update for Table ${data.order?.tableNumber}`,
                order: data.order,
                timestamp: data.timestamp || Date.now(),
              };
              handleIncomingNotification(notif);
            }
          } catch (e) {
            console.warn("WS parse error:", e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnecting in 3 seconds
          if (!isCancelled) {
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws?.close();
        };
      } catch (e) {
        setIsConnected(false);
        if (!isCancelled) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (ws) ws.close();
    };
  }, [isStaffOrAdmin]);

  // Fallback Polling (Every 4 seconds for maximum reliability)
  useEffect(() => {
    if (!isStaffOrAdmin) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications && data.notifications.length > 0) {
            const latest = data.notifications[0];
            if (latest.timestamp > lastProcessedTimeRef.current) {
              lastProcessedTimeRef.current = latest.timestamp;
              handleIncomingNotification(latest);
            }
          }
        }
      } catch (_) {}
    }, 4000);

    return () => clearInterval(interval);
  }, [isStaffOrAdmin]);

  const markAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <KitchenNotificationContext.Provider
      value={{
        isConnected,
        notifications,
        unreadCount,
        markAllRead,
        isMuted,
        setIsMuted,
      }}
    >
      {children}

      {/* Floating Kitchen Order Toast Alert for Staff & Admin */}
      {activeToast && isStaffOrAdmin && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-slideInRight shadow-cafe-lg">
          <div className="rounded-2xl border-2 border-cafe-primary bg-cafe-surface p-4 text-cafe-text shadow-2xl space-y-2">
            <div className="flex items-center justify-between border-b border-cafe-border pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cafe-primary text-cafe-surface animate-bounce-subtle">
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-serif text-sm font-bold text-cafe-primary">
                    New Kitchen Order!
                  </h4>
                  <p className="text-[10px] text-cafe-text/60">
                    Just now from {activeToast.order?.placedByRole || "Dining Floor"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Unmute chime" : "Mute chime"}
                  className="p-1 text-cafe-accent hover:text-cafe-primary rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setActiveToast(null)}
                  className="p-1 text-cafe-text/40 hover:text-cafe-primary rounded-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-cafe-peach px-2.5 py-0.5 text-xs font-bold text-cafe-primary border border-cafe-border">
                  Table {activeToast.order?.tableNumber || "?"}
                </span>
                <span className="font-serif text-sm font-bold text-cafe-primary">
                  ₹{activeToast.order?.total || 0}
                </span>
              </div>

              <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-cafe-text/80 bg-cafe-cream/60 p-2 rounded-xl border border-cafe-border">
                {activeToast.order?.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between font-medium">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    {item.price && <span className="opacity-70">₹{item.price * item.quantity}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-cafe-accent font-semibold">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Kitchen Sync
              </span>
              <button
                onClick={() => setActiveToast(null)}
                className="font-bold text-cafe-primary hover:underline"
              >
                Dismiss ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </KitchenNotificationContext.Provider>
  );
}

export function useKitchenNotification() {
  const context = useContext(KitchenNotificationContext);
  if (!context) {
    throw new Error("useKitchenNotification must be used within KitchenNotificationProvider");
  }
  return context;
}
