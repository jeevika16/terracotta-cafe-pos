import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-cafe-peach/70 border border-cafe-border/50", className)}
      {...props}
    />
  );
}

// ==================== TABLE SKELETON ====================

export function TableGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-cream/80 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-5 w-5 rounded-lg" />
          </div>

          <div className="my-2">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="border-t border-cafe-border/60 pt-2">
            <Skeleton className="h-3.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== MENU SKELETON ====================

export function MenuCatalogSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Category Pills Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Menu Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-cafe-border bg-cafe-cream/80 p-4 space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>

              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />

              <div className="pt-1">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-cafe-border/70 pt-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== ANALYTICS SKELETON ====================

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-cafe-border bg-cafe-cream/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-cafe-border bg-cafe-cream/80 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        <div className="rounded-3xl border border-cafe-border bg-cafe-cream/80 p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl border border-cafe-border bg-cafe-cream/80 p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ==================== USER MANAGEMENT SKELETON ====================

export function UserManagementSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-cafe-border bg-cafe-cream/80 p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-cafe-border bg-cafe-cream/80 p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
