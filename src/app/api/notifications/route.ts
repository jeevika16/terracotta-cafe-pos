import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentNotifications, broadcastKitchenNotification } from "@/lib/socketServer";

export async function GET() {
  const notifs = getRecentNotifications();
  return NextResponse.json({
    success: true,
    notifications: notifs,
    wsPort: parseInt(process.env.NEXT_PUBLIC_WS_PORT || "3001", 10),
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "EMPLOYEE")) {
      return NextResponse.json(
        { error: "Unauthorized: Staff permission required to post notifications" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const notification = {
      type: "NEW_KITCHEN_ORDER",
      order: body.order || {},
      message: body.message || "Kitchen Notification",
      timestamp: Date.now(),
    };

    broadcastKitchenNotification(notification);

    return NextResponse.json({ success: true, notification });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
