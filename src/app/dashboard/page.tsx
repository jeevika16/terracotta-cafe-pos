"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { UserManagement } from "@/components/dashboard/UserManagement";
import { SystemDatabaseTab } from "@/components/dashboard/SystemDatabaseTab";
import { ShieldAlert, BarChart3, Users, Database } from "lucide-react";

type DashboardTab = "ANALYTICS" | "USERS" | "DATABASE";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("ANALYTICS");

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <p className="text-xs font-semibold text-cafe-accent animate-pulse">
          Authenticating security privileges...
        </p>
      </div>
    );
  }

  if (userRole !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md p-8 text-center mt-16 rounded-2xl border border-cafe-border bg-cafe-cream">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-cafe-primary">Admin Access Required</h2>
        <p className="text-xs text-cafe-text/70 mt-2">
          The financial accounts and user provisioning portal is restricted solely to the Cafe Administrator.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-xl bg-cafe-primary px-5 py-2.5 text-xs font-bold text-cafe-surface hover:bg-cafe-accent transition-all"
        >
          Return to Table Management
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top Tab Navigation */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-cafe-border bg-cafe-cream p-1.5 w-fit shadow-cafe-sm">
        <button
          onClick={() => setActiveTab("ANALYTICS")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "ANALYTICS"
              ? "bg-cafe-primary text-cafe-surface shadow-cafe-sm"
              : "text-cafe-text hover:text-cafe-primary hover:bg-cafe-peach/50"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Accounts & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "USERS"
              ? "bg-cafe-primary text-cafe-surface shadow-cafe-sm"
              : "text-cafe-text hover:text-cafe-primary hover:bg-cafe-peach/50"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Staff & User Directory</span>
          <span className="rounded-full bg-cafe-accent px-1.5 py-0.2 text-[9px] font-bold text-white">
            Provision
          </span>
        </button>

        <button
          onClick={() => setActiveTab("DATABASE")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "DATABASE"
              ? "bg-cafe-primary text-cafe-surface shadow-cafe-sm"
              : "text-cafe-text hover:text-cafe-primary hover:bg-cafe-peach/50"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Database & Seeds</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "ANALYTICS" && <AnalyticsDashboard />}
      {activeTab === "USERS" && <UserManagement />}
      {activeTab === "DATABASE" && <SystemDatabaseTab />}
    </div>
  );
}
