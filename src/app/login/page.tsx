"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coffee, Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    if (res?.error) {
      setError("Invalid cafe credentials. Please check email and password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-cafe-border bg-cafe-cream p-8 shadow-cafe-lg">
        
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cafe-accent hover:text-cafe-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dining Room</span>
        </Link>

        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cafe-primary text-cafe-surface shadow-cafe-md">
            <Coffee className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-cafe-primary">
            Staff & Admin Portal
          </h2>
          <p className="mt-1 text-xs text-cafe-text/70">
            Sign in to manage floor tables, edit menus, and audit accounts
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cafe-text mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cafe-accent" />
              <input
                type="email"
                required
                placeholder="admin@terracottacafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface pl-10 pr-4 py-2.5 text-sm text-cafe-text placeholder-cafe-text/30 focus:border-cafe-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cafe-text mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cafe-accent" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-cafe-border bg-cafe-surface pl-10 pr-4 py-2.5 text-sm text-cafe-text placeholder-cafe-text/30 focus:border-cafe-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-cafe-primary py-3 text-sm font-bold text-cafe-surface shadow-cafe-md hover:bg-cafe-accent disabled:opacity-50 transition-all"
          >
            {isLoading ? "Verifying..." : "Sign In to Terminal"}
          </button>
        </form>

        {/* Quick Demo Credentials Badge */}
        <div className="rounded-2xl border border-cafe-border bg-cafe-peach/60 p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-cafe-primary">Demo Mock Credentials:</p>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@terracottacafe.com");
                setPassword("admin123");
              }}
              className="rounded-lg border border-cafe-border bg-white/80 p-2 text-left hover:bg-white transition-all shadow-sm"
            >
              <p className="font-bold text-cafe-primary text-[11px]">Admin Account</p>
              <p className="text-[10px] text-cafe-text/70">admin@terracottacafe.com</p>
              <p className="text-[9px] font-mono text-cafe-accent mt-0.5">Click to auto-fill</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("staff@terracottacafe.com");
                setPassword("staff123");
              }}
              className="rounded-lg border border-cafe-border bg-white/80 p-2 text-left hover:bg-white transition-all shadow-sm"
            >
              <p className="font-bold text-cafe-primary text-[11px]">Staff / Barista</p>
              <p className="text-[10px] text-cafe-text/70">staff@terracottacafe.com</p>
              <p className="text-[9px] font-mono text-cafe-accent mt-0.5">Click to auto-fill</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
