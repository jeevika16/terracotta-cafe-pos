import { NextResponse } from "next/server";
import { getRecentNotifications, broadcastKitchenNotification } from "@/lib/socketServer";

export async function GET() {
  const notifs = getRecentNotifications();
  return NextResponse.json({
    success: true,
    notifications: notifs,
    wsPort: parseInt(process.env.NEXT_PUBLIC_WS_PORT || "3001", 10),
  });
}

// Optional endpoint to test trigger a notification
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const notification = {
      type: "NEW_KITCHEN_ORDER",
      order: body.order || {
        tableNumber: "02",
        items: [{ name: "Terracotta Cortado", quantity: 2, price: 220 }],
        total: 440,
        placedByRole: "GUEST",
      },
      message: body.message || "Test Kitchen Notification",
      timestamp: Date.now(),
    };

    broadcastKitchenNotification(notification);

    return NextResponse.json({ success: true, notification });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
