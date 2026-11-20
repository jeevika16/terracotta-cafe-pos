"use client";

import React, { useState } from "react";
import { Database, Sparkles, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Copy } from "lucide-react";

export function SystemDatabaseTab() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSeed = async (clean = false) => {
    setIsSeeding(true);
    setError(null);
    try {
      const res = await fetch(`/api/seed${clean ? "?clean=true" : ""}`, {
        method: "POST",
      });
      const data = await res.json();
      setSeedResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to trigger seed");
    } finally {
      setIsSeeding(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-cafe-border pb-4">
        <span className="chip-peach uppercase text-[10px] tracking-wider font-bold">
          System Diagnostics & Sample Data
        </span>
        <h1 className="font-serif text-3xl font-bold text-cafe-primary mt-1">
          Database & Seed Tools
        </h1>
        <p className="text-xs text-cafe-text/70 mt-0.5">
          Populate dining room tables, artisanal menu items, sample audit orders, and staff credentials
        </p>
      </div>

      {/* Action Card */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-cream p-6 shadow-cafe-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cafe-primary text-cafe-surface shadow-cafe-sm flex-shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-cafe-primary">
                One-Click Database Seeder
              </h3>
              <p className="text-xs text-cafe-text/70 mt-0.5 max-w-xl">
                Automatically loads 8 restaurant floor tables, 9 artisanal recipes with costs and categories,
                sample completed orders for the financial dashboard, and pre-configured staff accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSeed(false)}
              disabled={isSeeding}
              className="flex items-center gap-2 rounded-xl bg-cafe-primary px-4 py-2.5 text-xs font-bold text-cafe-surface hover:bg-cafe-accent disabled:opacity-50 transition-all shadow-cafe-sm"
            >
              <Sparkles className={`h-4 w-4 ${isSeeding ? "animate-spin" : ""}`} />
              <span>{isSeeding ? "Seeding..." : "Seed / Sync Data"}</span>
            </button>

            <button
              onClick={() => handleSeed(true)}
              disabled={isSeeding}
              className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50 transition-all"
            >
              Reset & Fresh Seed
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {seedResult && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{seedResult.message}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-emerald-900">
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="font-bold">Mode:</span> {seedResult.databaseConnected ? "MongoDB Atlas" : "In-Memory Store"}
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="font-bold">Tables:</span> {seedResult.seededData?.tableCount || 8}
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="font-bold">Menu Items:</span> {seedResult.seededData?.menuItemCount || 9}
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="font-bold">Users:</span> {seedResult.seededData?.users?.length || 3}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Mock / Demo Accounts Card */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-cream p-6 shadow-cafe-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-cafe-border pb-3">
          <KeyRound className="h-4 w-4 text-cafe-accent" />
          <h3 className="font-serif text-sm font-bold text-cafe-primary">
            Quick-Login Staff & Admin Credentials
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              role: "ADMIN",
              name: "Master Roaster & Admin",
              email: "admin@terracottacafe.com",
              pass: "admin123",
              desc: "Full administrative access to financial sales, audits, and user provisioning.",
            },
            {
              role: "EMPLOYEE",
              name: "Barista Attendant",
              email: "staff@terracottacafe.com",
              pass: "staff123",
              desc: "Dining table status updates, table bill settlement, and POS ordering.",
            },
            {
              role: "EMPLOYEE",
              name: "Head Pastry Chef",
              email: "chef@terracottacafe.com",
              pass: "chef123",
              desc: "Kitchen order preparation, menu updates, and floor coordination.",
            },
          ].map((acc, idx) => (
            <div key={idx} className="rounded-2xl border border-cafe-border bg-cafe-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cafe-peach text-cafe-primary">
                  {acc.role}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>
              <p className="text-xs font-bold text-cafe-primary">{acc.name}</p>
              <div className="text-[11px] text-cafe-text space-y-0.5 bg-cafe-cream p-2 rounded-lg border border-cafe-border">
                <p>
                  <strong>Email:</strong> <code className="text-cafe-primary select-all">{acc.email}</code>
                </p>
                <p>
                  <strong>Password:</strong> <code className="text-cafe-primary select-all">{acc.pass}</code>
                </p>
              </div>
              <p className="text-[10px] text-cafe-text/60">{acc.desc}</p>
              <button
                onClick={() => copyToClipboard(`${acc.email} | ${acc.pass}`, idx)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-cafe-border py-1.5 text-[11px] font-semibold text-cafe-primary hover:bg-cafe-peach transition-colors"
              >
                <Copy className="h-3 w-3 text-cafe-accent" />
                <span>{copiedIndex === idx ? "Copied!" : "Copy Credentials"}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
