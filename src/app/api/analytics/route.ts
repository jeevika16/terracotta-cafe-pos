import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { getMockAnalytics } from "@/lib/mockData";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    // Strict Admin-only access
    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin has access to Accounts & Sales Dashboard" },
        { status: 403 }
      );
    }

    const db = await connectDB();
    if (db) {
      try {
        // 1. Overall Sales Summary
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

        if (summaryAgg && summaryAgg.length > 0 && summaryAgg[0].totalOrders > 0) {
          const summary = summaryAgg[0];

          // 2. Item-Wise Sales Breakdown
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
              },
            },
            { $sort: { unitsSold: -1 } },
            { $limit: 15 },
          ]);

          // 3. Daily Sales Metrics for the Charts
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

          // 4. Payment method split
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
            soldItems,
            dailySales,
            paymentBreakdown,
          });
        }
      } catch (dbErr: any) {
        console.warn("MongoDB aggregate error, falling back to mock analytics:", dbErr?.message);
      }
    }

    // Mock analytics fallback
    return NextResponse.json(getMockAnalytics());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
