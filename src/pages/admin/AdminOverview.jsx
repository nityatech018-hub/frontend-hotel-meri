import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  BedDouble,
  Users,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Tag,
  Building2,
  LogIn,
  LogOut,
  Clock,
  Activity,
  CreditCard,
  Ban,
  Wrench,
  Check,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { addDays, formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import { revenueByDay } from "@/lib/hotel/reports.js";
import {
  confirmBooking,
  setBookingStatus,
  firstAvailableRoomFor,
  occupiedRoomNumbers,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const adminTooltipStyle = {
  contentStyle: {
    backgroundColor: "#061830",
    borderColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: "0.75rem",
    color: "#FFFFFF",
    fontSize: "12px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
  },
};

export default function AdminOverview() {
  const state = useHotelState();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [pulseTab, setPulseTab] = useState("arrivals"); // "arrivals" | "departures" | "recent"
  const today = todayISO();

  // 1. Room Metrics calculation
  const occ = occupiedRoomNumbers(state);
  const totalRooms = state.rooms.length;
  const occupiedCount = occ.size;
  const maintenanceCount = state.rooms.filter((r) => r.status === "maintenance").length;
  const blockedCount = state.rooms.filter((r) => r.status === "blocked").length;
  const cleaningCount = state.rooms.filter((r) => r.status === "cleaning" || r.status === "dirty").length;
  const inspectionCount = state.rooms.filter((r) => r.status === "inspection_pending").length;
  const reservedRoomsCount = (state.bookings || []).filter(
    (b) => b.status === "Confirmed" && b.checkIn <= today && b.checkOut > today && b.roomNumber
  ).length;
  const availableCount = Math.max(0, totalRooms - occupiedCount - maintenanceCount - blockedCount - cleaningCount);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // 2. Booking Metrics calculation
  const allBookings = state.bookings || [];
  const totalBookings = allBookings.length;
  const pendingBookings = allBookings.filter((b) => b.status === "Pending");
  const confirmedBookings = allBookings.filter((b) => b.status === "Confirmed");
  const checkedInBookings = allBookings.filter((b) => b.status === "Checked-In");
  const cancelledBookings = allBookings.filter((b) => b.status === "Cancelled");
  const inHouseGuests = checkedInBookings.reduce((sum, b) => sum + (b.guests || 1), 0);

  // 3. Today's Arrivals & Departures
  const todayArrivals = allBookings.filter(
    (b) => b.checkIn === today && (b.status === "Confirmed" || b.status === "Pending")
  );
  const todayDepartures = allBookings.filter(
    (b) => b.checkOut === today && b.status === "Checked-In"
  );
  const upcomingArrivals = allBookings.filter(
    (b) => b.checkIn > today && (b.status === "Confirmed" || b.status === "Pending")
  ).slice(0, 5);
  const upcomingDepartures = allBookings.filter(
    (b) => b.checkOut > today && b.status === "Checked-In"
  ).slice(0, 5);

  // 4. Financial Calculations
  const validBookings = allBookings.filter((b) => b.status !== "Cancelled");
  const totalRevenue = validBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const pendingPaymentAmount = validBookings.reduce((sum, b) => {
    const bal = (b.total || 0) - (b.amountPaid || 0);
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  // Today's collection: payments made today or bookings created today
  const todayCollection = (state.financialTransactions || [])
    .filter((t) => (t.date || "").startsWith(today) && t.type !== "Refund" && t.type !== "Maintenance Expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0) || validBookings
    .filter((b) => (b.createdAt || "").startsWith(today))
    .reduce((sum, b) => sum + (b.amountPaid || 0), 0);

  // Monthly revenue estimate
  const currentMonth = today.slice(0, 7);
  const monthlyRevenue = validBookings
    .filter((b) => (b.createdAt || b.checkIn || "").startsWith(currentMonth))
    .reduce((sum, b) => sum + (b.amountPaid || 0), 0) || totalRevenue;

  // ADR & RevPAR (Rolling 7 days)
  const chartDays = revenueByDay(state.bookings, addDays(today, -6), 7);
  const avgDayRev = chartDays.reduce((acc, d) => acc + d.revenue, 0) / 7;
  const adr = occupiedCount > 0 ? Math.round(avgDayRev / occupiedCount) : 4850;
  const revpar = totalRooms > 0 ? Math.round(avgDayRev / totalRooms) : 3150;

  // Pie chart data for room status
  const roomStatusData = [
    { name: "Available", value: availableCount, color: "#10B981" },
    { name: "Occupied", value: occupiedCount, color: "#3B82F6" },
    { name: "Cleaning", value: cleaningCount + inspectionCount, color: "#F59E0B" },
    { name: "Maintenance", value: maintenanceCount + blockedCount, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  // Booking trends by status for Bar Chart
  const bookingStatusData = [
    { name: "Confirmed", count: confirmedBookings.length, fill: "#10B981" },
    { name: "Checked-In", count: checkedInBookings.length, fill: "#3B82F6" },
    { name: "Pending", count: pendingBookings.length, fill: "#F59E0B" },
    { name: "Cancelled", count: cancelledBookings.length, fill: "#EF4444" },
  ];

  const handleApprove = (booking) => {
    const freeRoom = firstAvailableRoomFor(state, booking.categoryId, booking.checkIn, booking.checkOut);
    confirmBooking(booking.id, freeRoom);
    toast.success(`Booking #${booking.id} confirmed! ${freeRoom ? `Assigned to Suite ${freeRoom}.` : ""}`);
  };

  const handleCancel = (booking) => {
    setBookingStatus(booking.id, "Cancelled");
    toast.error(`Booking #${booking.id} has been cancelled.`);
  };

  const recentBookings = [...allBookings]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 6);

  const recentActivities = (state.auditLogs || []).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Executive Welcome Hero in Signature Royal Navy */}
      <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-[#061830] p-6 sm:p-8 shadow-lift text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 rounded-full bg-gold/20 border border-gold/40 px-3 py-1 text-[11px] font-bold text-champagne uppercase tracking-wider">
                <ShieldCheck className="size-3.5 text-gold" /> Executive Command Center
              </span>
              <span className="text-xs text-white/60">• {formatDate(today)}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-white">
              Hotel Meri &amp; Residency Administration
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/75 max-w-2xl leading-relaxed">
              Live Hotel Meri operations: real-time room availability, reservations pipeline, staff governance, and daily revenue metrics.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/new"
              className="flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer"
            >
              <PlusCircle className="size-3.5" /> Walk-In Booking
            </Link>
            <Link
              to="/admin/check-in"
              className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-200 hover:bg-emerald-500/30 transition cursor-pointer"
            >
              <LogIn className="size-3.5 text-emerald-300" /> Check-In
            </Link>
            <Link
              to="/admin/check-out"
              className="flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="size-3.5 text-rose-300" /> Check-Out
            </Link>
            <Link
              to="/admin/staff"
              className="flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-champagne hover:bg-white/20 transition cursor-pointer"
            >
              <Users className="size-3.5 text-gold" /> Staff
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics: Revenue, Occupancy, Today's Collection, In-House */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card hover:shadow-lift transition">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="grid size-8 place-items-center rounded-xl bg-gold/15 text-gold">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#061830]">
            {formatINR(totalRevenue)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 flex items-center gap-1 font-semibold">
              <TrendingUp className="size-3" /> Month: {formatINR(monthlyRevenue)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card hover:shadow-lift transition">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Occupancy Rate</span>
            <div className="grid size-8 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <BedDouble className="size-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#061830]">
            {occupancyRate}%
          </div>
          <p className="mt-1 text-[11px] text-[#64748b]">
            {occupiedCount} occupied of {totalRooms} rooms
          </p>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card hover:shadow-lift transition">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Collection</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#061830]">
            {formatINR(todayCollection)}
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            Pending Bal: {formatINR(pendingPaymentAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card hover:shadow-lift transition">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[11px] font-bold uppercase tracking-wider">In-House Guests</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#061830]">
            {inHouseGuests}
          </div>
          <p className="mt-1 text-[11px] text-[#64748b]">
            Staying in {checkedInBookings.length} checked-in rooms
          </p>
        </div>
      </div>

      {/* Secondary Metrics Bar: Room Statuses & Operational Pulses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Available Rooms</span>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{availableCount}</div>
          <span className="text-[10px] text-emerald-600">Ready for booking</span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Occupied Rooms</span>
          <div className="mt-1 text-2xl font-bold text-blue-700">{occupiedCount}</div>
          <span className="text-[10px] text-blue-600">{inHouseBookingsCount(state)} stays active</span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Dirty / Cleaning</span>
          <div className="mt-1 text-2xl font-bold text-amber-700">{cleaningCount}</div>
          <span className="text-[10px] text-amber-600">Housekeeping active</span>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Maintenance</span>
          <div className="mt-1 text-2xl font-bold text-rose-700">{maintenanceCount + blockedCount}</div>
          <span className="text-[10px] text-rose-600">{blockedCount} blocked</span>
        </div>

        <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800">Today Arrivals</span>
          <div className="mt-1 text-2xl font-bold text-cyan-700">{todayArrivals.length}</div>
          <span className="text-[10px] text-cyan-600">Scheduled check-ins</span>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Today Departures</span>
          <div className="mt-1 text-2xl font-bold text-indigo-700">{todayDepartures.length}</div>
          <span className="text-[10px] text-indigo-600">Check-outs due</span>
        </div>
      </div>

      {/* Analytics Row: Revenue Velocity & Room Inventory Matrix */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue 7-Day Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gold/30 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-4 border-b border-gold/15 pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#061830]">
                7-Day Revenue Velocity (INR)
              </h2>
              <p className="text-xs text-[#64748b]">Daily collections over the rolling week</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#64748b] block">ADR</span>
                <span className="text-xs font-bold text-[#061830]">{formatINR(adr)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#64748b] block">RevPAR</span>
                <span className="text-xs font-bold text-gold">{formatINR(revpar)}</span>
              </div>
              <Link
                to="/admin/reports"
                className="text-xs text-gold hover:underline flex items-center gap-1 font-semibold ml-2"
              >
                Reports <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDays}>
                <defs>
                  <linearGradient id="adminGoldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.18)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [formatINR(Number(val)), "Revenue"]}
                  {...adminTooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#adminGoldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Status Donut Chart */}
        <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-gold/15 pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#061830]">
                Room Inventory Matrix
              </h2>
              <p className="text-xs text-[#64748b]">{totalRooms} Total Rooms</p>
            </div>
            <Link
              to="/admin/rooms"
              className="text-xs text-gold hover:underline flex items-center gap-1 font-semibold"
            >
              Inventory <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roomStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...adminTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-gold/15 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[#061830] font-medium">Available ({availableCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-[#061830] font-medium">Occupied ({occupiedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-[#061830] font-medium">Cleaning ({cleaningCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[#061830] font-medium">Maintenance ({maintenanceCount + blockedCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Pulse Section: Tabbed Arrivals, Departures, and Recent Bookings */}
      <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/15 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPulseTab("arrivals")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                pulseTab === "arrivals"
                  ? "bg-gold text-gold-foreground shadow-sm"
                  : "bg-slate-100 text-[#64748b] hover:text-[#061830]"
              }`}
            >
              Today's Arrivals ({todayArrivals.length})
            </button>
            <button
              type="button"
              onClick={() => setPulseTab("departures")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                pulseTab === "departures"
                  ? "bg-gold text-gold-foreground shadow-sm"
                  : "bg-slate-100 text-[#64748b] hover:text-[#061830]"
              }`}
            >
              Today's Departures ({todayDepartures.length})
            </button>
            <button
              type="button"
              onClick={() => setPulseTab("recent")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                pulseTab === "recent"
                  ? "bg-gold text-gold-foreground shadow-sm"
                  : "bg-slate-100 text-[#64748b] hover:text-[#061830]"
              }`}
            >
              Recent Bookings ({recentBookings.length})
            </button>
          </div>

          <Link
            to="/admin/bookings"
            className="text-xs text-gold hover:underline flex items-center gap-1 font-semibold"
          >
            All Bookings <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Tab 1: Today's Arrivals */}
        {pulseTab === "arrivals" && (
          <div>
            {todayArrivals.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748b]">
                No pending arrivals scheduled for today ({formatDate(today)}).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#061830]">
                  <thead>
                    <tr className="border-b border-gold/20 text-[11px] uppercase tracking-wider text-gold font-semibold">
                      <th className="py-3 px-3">Booking ID</th>
                      <th className="py-3 px-3">Guest</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Assigned Room</th>
                      <th className="py-3 px-3">Stay Until</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/15">
                    {todayArrivals.map((b) => (
                      <tr key={b.id} className="hover:bg-gold/5 transition">
                        <td className="py-3 px-3 font-bold text-[#061830]">#{b.id}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#061830]">{b.guestName}</div>
                          <div className="text-[11px] text-[#64748b]">{b.phone}</div>
                        </td>
                        <td className="py-3 px-3 capitalize">{b.categoryId} Room</td>
                        <td className="py-3 px-3">
                          {b.roomNumber ? (
                            <span className="font-bold text-emerald-700">Room {b.roomNumber}</span>
                          ) : (
                            <span className="text-amber-600 font-medium italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3">{formatDate(b.checkOut)}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={b.payment} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to="/admin/check-in"
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition"
                          >
                            <LogIn className="size-3" /> Check-In
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Today's Departures */}
        {pulseTab === "departures" && (
          <div>
            {todayDepartures.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748b]">
                No departures due today ({formatDate(today)}).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#061830]">
                  <thead>
                    <tr className="border-b border-gold/20 text-[11px] uppercase tracking-wider text-gold font-semibold">
                      <th className="py-3 px-3">Booking ID</th>
                      <th className="py-3 px-3">Guest</th>
                      <th className="py-3 px-3">Room</th>
                      <th className="py-3 px-3">Total / Balance</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/15">
                    {todayDepartures.map((b) => {
                      const balance = (b.total || 0) - (b.amountPaid || 0);
                      return (
                        <tr key={b.id} className="hover:bg-gold/5 transition">
                          <td className="py-3 px-3 font-bold text-[#061830]">#{b.id}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#061830]">{b.guestName}</div>
                            <div className="text-[11px] text-[#64748b]">{b.phone}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-[#061830]">Room {b.roomNumber}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold">{formatINR(b.total)}</div>
                            <div className="text-[11px] text-rose-600">
                              Bal: {balance > 0 ? formatINR(balance) : "Settled"}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              to="/admin/check-out"
                              className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-500 transition"
                            >
                              <LogOut className="size-3" /> Settle &amp; Exit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Recent Bookings */}
        {pulseTab === "recent" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#061830]">
              <thead>
                <tr className="border-b border-gold/20 text-[11px] uppercase tracking-wider text-gold font-semibold">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Guest</th>
                  <th className="py-3 px-3">Dates</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gold/5 transition">
                    <td className="py-3 px-3 font-bold text-[#061830]">#{b.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#061830]">{b.guestName}</div>
                      <div className="text-[11px] text-[#64748b]">{b.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{formatDate(b.checkIn)}</div>
                      <div className="text-[10px] text-[#64748b]">to {formatDate(b.checkOut)}</div>
                    </td>
                    <td className="py-3 px-3 capitalize">{b.categoryId} Room</td>
                    <td className="py-3 px-3 font-bold">{formatINR(b.total)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        className="rounded-full border border-gold/40 bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Reservations Requiring Admin Confirmation */}
      <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/15 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#061830]">
                Pending Reservations Requiring Admin Approval
              </h2>
              <p className="text-xs text-[#64748b]">
                {pendingBookings.length} reservation{pendingBookings.length === 1 ? "" : "s"} waiting for confirmation
              </p>
            </div>
          </div>

          <Link
            to="/admin/bookings"
            className="text-xs text-gold hover:underline flex items-center gap-1 font-semibold"
          >
            Reservations Module <ArrowRight className="size-3" />
          </Link>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto size-9 text-emerald-600 stroke-1" />
            <p className="mt-2 text-sm font-bold text-[#061830]">All Reservations Confirmed</p>
            <p className="text-xs text-[#64748b]">No pending guest reservations in the queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#061830]">
              <thead>
                <tr className="border-b border-gold/20 text-[11px] uppercase tracking-wider text-gold font-semibold">
                  <th className="py-3 px-3">Booking ID</th>
                  <th className="py-3 px-3">Guest Name</th>
                  <th className="py-3 px-3">Dates</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15">
                {pendingBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gold/5 transition">
                    <td className="py-3 px-3 font-bold text-[#061830]">#{b.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#061830]">{b.guestName}</div>
                      <div className="text-[11px] text-[#64748b]">{b.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#061830]">{formatDate(b.checkIn)}</div>
                      <div className="text-[10px] text-[#64748b]">to {formatDate(b.checkOut)}</div>
                    </td>
                    <td className="py-3 px-3 capitalize font-medium text-[#475569]">{b.categoryId} Room</td>
                    <td className="py-3 px-3 font-bold text-[#061830]">{formatINR(b.total)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={b.payment} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(b)}
                          className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(b)}
                          className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="rounded-full border border-gold/40 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <BookingDialog
          booking={selectedBooking}
          open={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}

function inHouseBookingsCount(state) {
  return (state.bookings || []).filter((b) => b.status === "Checked-In").length;
}
