import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  History,
  Bell,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Download,
  AlertCircle,
  Clock,
  Eye,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, todayISO } from "@/lib/hotel/pricing.js";
import {
  markNotificationRead,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminLogsPage() {
  const state = useHotelState();
  const [activeTab, setActiveTab] = useState("audit"); // "audit" | "notifications"
  const [moduleFilter, setModuleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const today = todayISO();

  const auditLogs = state.auditLogs || [];
  const notifications = state.notifications || [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredLogs = auditLogs.filter((l) => {
    if (moduleFilter !== "all" && l.module !== moduleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.user && l.user.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.module && l.module.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach((n) => markNotificationRead(n.id));
    toast.success("All notifications marked as read!");
  };

  const handleExportAuditTrail = () => {
    const headers = ["ID,Timestamp,User,Module,Action,Details\n"];
    const rows = filteredLogs.map((l) =>
      `"${l.id}","${l.timestamp}","${l.user}","${l.module}","${l.action}","${l.details || ""}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hotel_meri_audit_log_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit trail log exported to CSV successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Governance &amp; Security Compliance
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Audit Trails &amp; Operational Alerts
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Cryptographically timestamped action logs, user privilege accountability, and real-time operational alerts feed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportAuditTrail}
            className="flex items-center gap-2 rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10 transition shadow-sm cursor-pointer"
          >
            <Download className="size-4 text-gold" /> Export Audit Log
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gold/20 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#061830] text-champagne shadow-sm"
              : "text-[#64748b] hover:text-[#061830]"
          }`}
        >
          <History className="size-4 text-gold" /> Searchable Audit Trail ({auditLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
            activeTab === "notifications"
              ? "bg-[#061830] text-champagne shadow-sm"
              : "text-[#64748b] hover:text-[#061830]"
          }`}
        >
          <Bell className="size-4 text-gold" /> Alerts Feed
          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "audit" ? (
        /* Audit Trail Section */
        <div className="space-y-4">
          <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 size-3.5 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search user, action, details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
              >
                <option value="all">All Modules</option>
                <option value="Bookings">Reservations &amp; Stays</option>
                <option value="Rooms">Room Inventory</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Finance">Financial Ledger</option>
                <option value="Staff">Staff Management</option>
              </select>
            </div>

            <div className="text-xs text-[#64748b]">
              Showing <strong>{filteredLogs.length}</strong> logged actions
            </div>
          </div>

          <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#061830]">
                <thead>
                  <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Staff / User</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">Action Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/15">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-gold/5 transition">
                      <td className="py-3.5 px-4 text-[#64748b] font-mono text-[11px] whitespace-nowrap">
                        {l.timestamp}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#061830]">
                        {l.user || "System Administrator"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-gold/15 border border-gold/30 px-2.5 py-0.5 text-[10px] font-bold text-[#061830]">
                          {l.module || "System"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#061830]">{l.action}</td>
                      <td className="py-3.5 px-4 text-[#64748b] max-w-md">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Real-Time Operational Notifications Feed */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#061830]">
              Operational Alert Feeds
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-gold font-bold hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-gold/30 bg-white p-6">
                <CheckCircle2 className="mx-auto size-10 text-emerald-600 stroke-1" />
                <h4 className="mt-2 text-sm font-bold text-[#061830]">No Alerts</h4>
                <p className="text-xs text-[#64748b]">All operations running smoothly with zero alerts.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4 transition flex items-center justify-between ${
                    n.read
                      ? "border-gold/20 bg-white"
                      : "border-gold/50 bg-[#FAF7F2] shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-gold/15 text-gold shrink-0">
                      <Bell className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[#061830]">{n.title}</h4>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-rose-500 inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-[#94a3b8]">{n.time || "Recently"}</span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-[#061830] hover:bg-gold/10"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
