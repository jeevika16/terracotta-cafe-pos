"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Coffee,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Search,
} from "lucide-react";
import { IUserAccount, UserRole } from "@/types";
import { UserManagementSkeleton } from "@/components/ui/Skeleton";
import { apiUrl } from "@/lib/api";

export function UserManagement() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [users, setUsers] = useState<IUserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("EMPLOYEE");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl("/api/users"));
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json();
        console.error("Failed to load users:", err.error);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/api/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff account");
      }

      setSuccessBanner(`Successfully registered ${data.user.name} as ${data.user.role}!`);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setRole("EMPLOYEE");
      setIsModalOpen(false);
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove user "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/users?id=${userId}`), {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setSuccessBanner(`Removed account for ${userName}`);
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const staffCount = users.filter((u) => u.role === "EMPLOYEE").length;

  return (
    <div className="space-y-6">
      {/* Top Banner Notifications */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-cafe-border pb-4">
        <div>
          <span className="chip-peach uppercase text-[10px] tracking-wider font-bold">
            Staff Security & Access Control
          </span>
          <h1 className="font-serif text-3xl font-bold text-cafe-primary mt-1">
            Staff & User Management
          </h1>
          <p className="text-xs text-cafe-text/70 mt-0.5">
            Create and maintain staff profiles, role permissions, and POS login credentials
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            title="Refresh directory"
            className="rounded-xl border border-cafe-border bg-cafe-cream p-2.5 text-cafe-primary hover:bg-cafe-peach transition-all shadow-cafe-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-cafe-primary px-4 py-2.5 text-xs font-bold text-cafe-surface shadow-cafe-md hover:bg-cafe-accent transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <UserManagementSkeleton />
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-5 shadow-cafe-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cafe-text/70">Total Staff Accounts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-peach text-cafe-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-cafe-primary">{users.length}</p>
          <p className="mt-1 text-[11px] text-cafe-text/60">Registered in terminal directory</p>
        </div>

        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-5 shadow-cafe-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cafe-text/70">Administrators</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cafe-accent/20 text-cafe-accent">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-cafe-primary">{adminCount}</p>
          <p className="mt-1 text-[11px] text-cafe-accent font-semibold">Full accounts & audit rights</p>
        </div>

        <div className="rounded-2xl border border-cafe-border bg-cafe-cream p-5 shadow-cafe-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cafe-text/70">Baristas & Staff</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Coffee className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-cafe-primary">{staffCount}</p>
          <p className="mt-1 text-[11px] text-emerald-700 font-semibold">Floor table & POS access</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cafe-text/50" />
          <input
            type="text"
            placeholder="Search staff by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-cafe-border bg-cafe-cream pl-10 pr-4 py-2.5 text-xs text-cafe-text placeholder-cafe-text/40 focus:border-cafe-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-2xl border border-cafe-border bg-cafe-cream shadow-cafe-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-cafe-border bg-cafe-peach/40 text-[11px] uppercase tracking-wider text-cafe-text font-bold">
              <tr>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-cafe-accent">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin mb-2" />
                    Loading staff directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-cafe-text/60">
                    No users matching &quot;{searchQuery}&quot; found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u._id === currentUserId || u.email === session?.user?.email;
                  const initials = u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={u._id} className="hover:bg-cafe-peach/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cafe-primary text-xs font-bold text-cafe-surface">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-cafe-primary">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-cafe-peach px-1.5 py-0.5 text-[9px] font-bold text-cafe-accent">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-cafe-text/70">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cafe-primary/10 border border-cafe-primary/20 px-2.5 py-1 text-[10px] font-bold text-cafe-primary">
                            <ShieldCheck className="h-3 w-3 text-cafe-accent" />
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                            <Coffee className="h-3 w-3 text-amber-600" />
                            Employee / Barista
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-cafe-text/60">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Pre-configured"}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            title="Remove staff member"
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Add New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-cafe-border bg-cafe-cream p-6 shadow-cafe-lg">
            <div className="flex items-center justify-between border-b border-cafe-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cafe-primary text-cafe-surface">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-cafe-primary">
                  Provision New Staff User
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-cafe-text/50 hover:text-cafe-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-cafe-text mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-3.5 py-2.5 text-xs text-cafe-text placeholder-cafe-text/40 focus:border-cafe-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cafe-text mb-1">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya@terracottacafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-cafe-border bg-cafe-surface px-3.5 py-2.5 text-xs text-cafe-text placeholder-cafe-text/40 focus:border-cafe-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cafe-text mb-1">
                  Initial Password <span className="text-rose-500">* (min 6 chars)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-cafe-border bg-cafe-surface pl-3.5 pr-10 py-2.5 text-xs text-cafe-text placeholder-cafe-text/40 focus:border-cafe-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-text/50 hover:text-cafe-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cafe-text mb-1">
                  Role & Access Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("EMPLOYEE")}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                      role === "EMPLOYEE"
                        ? "border-cafe-primary bg-cafe-primary text-cafe-surface shadow-sm"
                        : "border-cafe-border bg-cafe-surface text-cafe-text hover:bg-cafe-peach/30"
                    }`}
                  >
                    <Coffee className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Employee</p>
                      <p className="text-[10px] opacity-80">POS & Tables</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ADMIN")}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                      role === "ADMIN"
                        ? "border-cafe-primary bg-cafe-primary text-cafe-surface shadow-sm"
                        : "border-cafe-border bg-cafe-surface text-cafe-text hover:bg-cafe-peach/30"
                    }`}
                  >
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Admin</p>
                      <p className="text-[10px] opacity-80">Full Access</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cafe-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-cafe-border px-4 py-2.5 text-xs font-semibold text-cafe-text hover:bg-cafe-peach/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-cafe-primary px-5 py-2.5 text-xs font-bold text-cafe-surface hover:bg-cafe-accent disabled:opacity-50 transition-all shadow-cafe-sm"
                >
                  {isSubmitting ? "Creating..." : "Save Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
