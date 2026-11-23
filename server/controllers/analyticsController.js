const Order = require("../models/Order");

// GET /api/analytics - Get cafe sales and financial breakdown
async function getAnalytics(req, res) {
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

    const summary = summaryAgg && summaryAgg.length > 0
      ? summaryAgg[0]
      : { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalItemsSold: 0 };

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
          category: "Artisan Cafe",
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 15 },
    ]);

    // 3. Daily Sales Metrics (Last 30 days)
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

    // 4. Payment breakdown
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

    return res.status(200).json({
      summary,
      soldItems: soldItems || [],
      dailySales: dailySales || [],
      paymentBreakdown: paymentBreakdown || [],
    });
  } catch (error) {
    console.error("Error computing analytics:", error);
    return res.status(500).json({ error: error.message || "Failed to compute sales analytics" });
  }
}

module.exports = {
  getAnalytics,
};
