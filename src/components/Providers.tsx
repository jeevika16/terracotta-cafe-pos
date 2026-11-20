"use client";

import { SessionProvider } from "next-auth/react";
import { OrderProvider } from "@/context/OrderContext";
import { KitchenNotificationProvider } from "@/components/notifications/KitchenNotificationProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OrderProvider>
        <KitchenNotificationProvider>
          {children}
        </KitchenNotificationProvider>
      </OrderProvider>
    </SessionProvider>
  );
}
