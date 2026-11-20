"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { IndianRupee, ShoppingBag, TrendingUp, Award, Calendar, Coffee, FileSpreadsheet } from "lucide-react";
import { ISalesSummary, ISoldItemMetric, IDailySalesMetric } from "@/types";

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<ISalesSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalItemsSold: 0,
  });
  const [soldItems, setSoldItems] = useState<ISoldItemMetric[]>([]);
  const [dailySales, setDailySales] = useState<IDailySalesMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then((data) => {
        if (data.summary) setSummary(data.summary);
        if (data.soldItems) setSoldItems(data.soldItems);
        if (data.dailySales) setDailySales(data.dailySales);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Coffee className="mx-auto h-8 w-8 text-cafe-primary animate-bounce" />
          <p className="mt-2 text-xs font-semibold text-cafe-accent">Brewing analytics & accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-cafe-border pb-4">
        <div>
          <span className="chip-peach uppercase text-[10px] tracking-wider font-bold">
            Executive Financial Overview
          </span>
          <h1 className="font-serif text-3xl font-bold text-cafe-primary mt-1">
            Accounts & Sales Analytics
          </h1>
          <p className="text-xs text-cafe-text/70 mt-0.5">
            Real-time audit of sold items, gross margins, and daily cafe revenue
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl border border-cafe-border bg-cafe-cream px-4 py-2 text-xs font-semibold text-cafe-primary hover:bg-cafe-peach transition-all shadow-cafe-sm"
        >
          <FileSpreadsheet className="h-4 w-4 text-cafe-accent" />
          <span>Print / Export Audit</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-5 shadow-cafe-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cafe-text/70">Total Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-peach text-cafe-primary">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-cafe-primary">
            ₹{summary.totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Settled accounts
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-5 shadow-cafe-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cafe-text/70">Completed Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-peach text-cafe-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-cafe-primary">
            {summary.totalOrders}
          </p>
          <p className="mt-1 text-[11px] text-cafe-text/60">Across all floor tables</p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-5 shadow-cafe-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cafe-text/70">Avg Order Value (AOV)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-peach text-cafe-primary">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-cafe-primary">
            ₹{Math.round(summary.averageOrderValue || 0)}
          </p>
          <p className="mt-1 text-[11px] text-cafe-text/60">Per dining party</p>
        </div>

        {/* Total Items Sold */}
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-5 shadow-cafe-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cafe-text/70">Units Sold</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-peach text-cafe-primary">
              <Coffee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-cafe-primary">
            {summary.totalItemsSold || soldItems.reduce((acc, i) => acc + i.unitsSold, 0)}
          </p>
          <p className="mt-1 text-[11px] text-cafe-text/60">Beverages, bakery & mains</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-6 shadow-cafe-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-cafe-primary">
              Revenue Over Time
            </h3>
            <p className="text-xs text-cafe-text/60">Daily sales trajectory (₹)</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-cafe-accent font-semibold">
            <Calendar className="h-3.5 w-3.5" /> Recent timeline
          </span>
        </div>

        <div className="h-72 w-full">
          {dailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="terracottaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A63D26" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FFF0E7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E4DD" vertical={false} />
                <XAxis dataKey="date" stroke="#352B28" fontSize={11} tickLine={false} />
                <YAxis stroke="#352B28" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFDFB",
                    borderColor: "#F0E4DD",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 12px rgba(166, 61, 38, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#A63D26"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#terracottaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-cafe-text/50">
              No sales data recorded yet. Settle customer bills to populate graph.
            </div>
          )}
        </div>
      </div>

      {/* Sold Items Tracking Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Sold Items Bar Chart */}
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-6 shadow-cafe-sm">
          <h3 className="font-serif text-lg font-bold text-cafe-primary mb-1">
            Top Sold Items by Quantity
          </h3>
          <p className="text-xs text-cafe-text/60 mb-4">
            Direct measure of popular dishes and fast-moving inventory
          </p>

          <div className="h-72 w-full">
            {soldItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={soldItems.slice(0, 7)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E4DD" vertical={false} />
                  <XAxis dataKey="name" stroke="#352B28" fontSize={10} interval={0} angle={-25} textAnchor="end" />
                  <YAxis stroke="#352B28" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFDFB",
                      borderColor: "#F0E4DD",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="unitsSold" fill="#C65F43" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-cafe-text/50">
                No items sold yet.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Sold Items Ledger Table */}
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-6 shadow-cafe-sm">
          <h3 className="font-serif text-lg font-bold text-cafe-primary mb-1">
            Sold Items Breakdown
          </h3>
          <p className="text-xs text-cafe-text/60 mb-4">
            Itemized quantity sold and gross revenue contribution
          </p>

          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-cafe-cream border-b border-cafe-border text-cafe-accent font-bold">
                <tr>
                  <th className="pb-2">Item Name</th>
                  <th className="pb-2 text-center">Units Sold</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border/60">
                {soldItems.length > 0 ? (
                  soldItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-cafe-peach/30 transition-colors">
                      <td className="py-2.5 font-semibold text-cafe-text">{item.name}</td>
                      <td className="py-2.5 text-center font-bold text-cafe-accent">
                        {item.unitsSold}
                      </td>
                      <td className="py-2.5 text-right font-bold text-cafe-primary">
                        ₹{item.totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-cafe-text/50">
                      No sold items records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
