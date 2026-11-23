import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getDbAnalytics } from "@/lib/persistentDb";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin has access to Accounts & Sales Dashboard" },
        { status: 403 }
      );
    }

    const db = await connectDB();
    if (db) {
      try {
        const summaryAgg = await Order.aggregate([
          { $match: { paymentStatus: "PAID" } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$total" },
              totalOrders: { $sum: 1 },
              averageOrderValue: { $avg: "$total" },
              totalItemsSold: { $sum: { $sum: "$items.quantity" } },
            },
          },
        ]);

        const summary = summaryAgg && summaryAgg.length > 0
          ? summaryAgg[0]
          : { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalItemsSold: 0 };

        const soldItems = await Order.aggregate([
          { $match: { paymentStatus: "PAID" } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.name",
              unitsSold: { $sum: "$items.quantity" },
              totalRevenue: { $sum: "$items.subtotal" },
            },
          },
          {
            $project: {
              _id: 0,
              name: "$_id",
              unitsSold: 1,
              totalRevenue: 1,
              category: "Artisan Cafe",
            },
          },
          { $sort: { unitsSold: -1 } },
          { $limit: 15 },
        ]);

        const dailySales = await Order.aggregate([
          { $match: { paymentStatus: "PAID" } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$total" },
              ordersCount: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              revenue: 1,
              ordersCount: 1,
            },
          },
          { $sort: { date: 1 } },
          { $limit: 30 },
        ]);

        const paymentBreakdown = await Order.aggregate([
          { $match: { paymentStatus: "PAID" } },
          {
            $group: {
              _id: "$paymentMethod",
              total: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
        ]);

        return NextResponse.json({
          summary,
          soldItems: soldItems || [],
          dailySales: dailySales || [],
          paymentBreakdown: paymentBreakdown || [],
        });
      } catch (dbErr: any) {
        console.warn("MongoDB aggregate notice:", dbErr?.message);
      }
    }

    return NextResponse.json(getDbAnalytics());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
