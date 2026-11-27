import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble,
  CalendarCheck,
  DoorOpen,
  IndianRupee,
  LogIn,
  LogOut,
  ClipboardList,
  Search,
  PlusCircle,
  Users,
  CreditCard,
  AlertCircle,
  Sparkles,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { EmptyState, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  checkInBooking,
  checkOutBooking,
  freeRoomsFor,
  getCategory,
  occupiedRoomNumbers,
  heldRoomNumbers,
  getEffectiveRoomStatus,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function ReceptionOverview() {
  const state = useHotelState();
  const navigate = useNavigate();
  const today = todayISO();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const occ = occupiedRoomNumbers(state, today);
  const totalRooms = state.rooms.length;

  // Real-time effective Room status counts (strictly accounting for today's active & held bookings)
  const roomStatusMap = state.rooms.map((r) => getEffectiveRoomStatus(state, r, today));
  const availableRoomsCount = roomStatusMap.filter((st) => st === "available" || st === "ready").length;
  const reservedRoomsCount = roomStatusMap.filter((st) => st === "reserved").length;
  const occupiedRoomsCount = roomStatusMap.filter((st) => st === "occupied").length;
  const cleaningRoomsCount = roomStatusMap.filter((st) => st === "cleaning" || st === "dirty").length;
  const maintenanceRoomsCount = roomStatusMap.filter((st) => st === "maintenance").length;
  const inspectionRoomsCount = roomStatusMap.filter((st) => st === "inspection_pending").length;
  const blockedRoomsCount = roomStatusMap.filter((st) => st === "blocked").length;

  // Bookings calculations
  const totalBookingsCount = state.bookings.length;
  const pendingBookingsCount = state.bookings.filter((b) => b.status === "Pending").length;
  const inHouseGuestsCount = state.bookings.filter((b) => b.status === "Checked-In").length;

  // Today's arrivals and departures
  const todaysArrivals = state.bookings.filter(
    (b) => b.checkIn === today && (b.status === "Confirmed" || b.status === "Pending")
  );
  const pendingCheckInsCount = todaysArrivals.length;

  const todaysDepartures = state.bookings.filter(
    (b) => b.checkOut === today && b.status === "Checked-In"
  );
  const pendingCheckOutsCount = todaysDepartures.length;

  // Financial calculations
  const todaysTransactions = (state.financialTransactions || []).filter(
    (t) => t.createdAt === today && (t.type === "payment" || t.type === "advance")
  );
  const todaysCollection = todaysTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const outstandingBalanceTotal = state.bookings
    .filter((b) => b.status !== "Cancelled")
    .reduce((sum, b) => sum + Math.max(0, (b.total || 0) - (b.amountPaid || 0)), 0);

  // Quick Check-in action from table
  const handleQuickCheckIn = (e, b) => {
    e.stopPropagation();
    const free = freeRoomsFor(state, b.categoryId);
    const roomToAssign = b.roomNumber && free.includes(b.roomNumber) ? b.roomNumber : free[0];
    if (!roomToAssign) {
      toast.error(`No free rooms ready in ${getCategory(state, b.categoryId)?.name || "category"}! Please reassign in Check-In desk.`);
      navigate(`/reception/check-in?q=${b.id}`);
      return;
    }
    checkInBooking(b.id, roomToAssign);
    toast.success(`${b.guestName} successfully checked into Room ${roomToAssign}!`);
  };

  // Quick Check-out action from table
  const handleQuickCheckOut = (e, b) => {
    e.stopPropagation();
    const bal = Math.max(0, b.total - b.amountPaid);
    if (bal > 0) {
      toast.info(`Guest has an outstanding balance of ${formatINR(bal)}. Navigating to checkout folio settlement...`);
      navigate(`/reception/check-out?q=${b.id}`);
      return;
    }
    checkOutBooking(b.id);
    toast.success(`${b.guestName} successfully checked out! Room ${b.roomNumber} queued for housekeeping.`);
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/reception/bookings?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Reception Fast Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-white p-3.5 sm:p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5 mr-1">
            <CalendarCheck className="size-4" /> Quick Desk:
          </span>
          <Link
            to="/reception/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-3.5 py-2 text-xs font-bold text-navy-deep shadow-sm hover:brightness-110 transition"
          >
            <DoorOpen className="size-3.5" />
            <span>Walk-In Booking</span>
          </Link>
          <Link
            to="/reception/check-in"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
          >
            <LogIn className="size-3.5 text-emerald-600" />
            <span>Check-In Guest</span>
            {pendingCheckInsCount > 0 && (
              <span className="rounded-full bg-emerald-200 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900">
                {pendingCheckInsCount}
              </span>
            )}
          </Link>
          <Link
            to="/reception/check-out"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition shadow-sm"
          >
            <LogOut className="size-3.5 text-rose-600" />
            <span>Check-Out Guest</span>
            {pendingCheckOutsCount > 0 && (
              <span className="rounded-full bg-rose-200 px-1.5 py-0.2 text-[10px] font-bold text-rose-900">
                {pendingCheckOutsCount}
              </span>
            )}
          </Link>
          <Link
            to="/reception/rooms"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition shadow-sm"
          >
            <BedDouble className="size-3.5 text-blue-600" />
            <span>View Available Rooms</span>
          </Link>
        </div>

        {/* Quick Search Guest/Booking */}
        <form onSubmit={handleGlobalSearch} className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gold" />
          <input
            type="text"
            placeholder="Search Guest or Booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] placeholder:text-[#64748b] focus:border-gold focus:outline-none"
          />
        </form>
      </div>

      {/* 2. Key Operational Stat Cards (Real-Time Database Records) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        <StatCard
          icon={LogIn}
          label="Today's Arrivals"
          value={todaysArrivals.length}
          hint={`${pendingCheckInsCount} pending check-in`}
          tone="gold"
        />
        <StatCard
          icon={LogOut}
          label="Today's Departures"
          value={todaysDepartures.length}
          hint={`${pendingCheckOutsCount} pending check-out`}
          tone="default"
        />
        <StatCard
          icon={Users}
          label="In-House Guests"
          value={inHouseGuestsCount}
          hint="Currently staying"
          tone="emerald"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Bookings"
          value={totalBookingsCount}
          hint={`${pendingBookingsCount} pending`}
          tone="default"
        />
        <StatCard
          icon={DoorOpen}
          label="Available Rooms"
          value={availableRoomsCount}
          hint={`${totalRooms} total rooms`}
          tone="emerald"
        />
        <StatCard
          icon={BedDouble}
          label="Occupied Rooms"
          value={occupiedRoomsCount}
          hint={`${Math.round((occupiedRoomsCount / (totalRooms || 1)) * 100)}% occupancy`}
          tone="gold"
        />
        <StatCard
          icon={Sparkles}
          label="Rooms Cleaning"
          value={cleaningRoomsCount}
          hint="Under housekeeping"
          tone="default"
        />
        <StatCard
          icon={Wrench}
          label="Rooms Maintenance"
          value={maintenanceRoomsCount}
          hint="Under repair"
          tone="default"
        />
        <StatCard
          icon={CalendarCheck}
          label="Pending Check-Ins"
          value={pendingCheckInsCount}
          hint="Due today"
          tone="gold"
        />
        <StatCard
          icon={LogOut}
          label="Pending Check-Outs"
          value={pendingCheckOutsCount}
          hint="Due today"
          tone="default"
        />
        <StatCard
          icon={IndianRupee}
          label="Today's Collection"
          value={formatINR(todaysCollection)}
          hint="Payments received today"
          tone="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Outstanding Balance"
          value={formatINR(outstandingBalanceTotal)}
          hint="Active uncollected folios"
          tone="gold"
        />
      </div>

      {/* 3. Room Availability Lifecycle Grid */}
      <Panel
        title="Room Inventory Lifecycle Status"
        subtitle={`Live operational state of all ${totalRooms} rooms across Hotel Meri`}
        action={
          <Link
            to="/reception/rooms"
            className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
          >
            Full Inventory Board <ArrowRight className="size-3" />
          </Link>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { label: "Available", count: availableRoomsCount, color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
            { label: "Reserved", count: reservedRoomsCount, color: "bg-amber-50 text-amber-800 border-amber-300" },
            { label: "Occupied", count: occupiedRoomsCount, color: "bg-blue-50 text-blue-800 border-blue-300" },
            { label: "Dirty", count: state.rooms.filter((r) => r.status === "dirty").length, color: "bg-rose-50 text-rose-800 border-rose-300" },
            { label: "Cleaning", count: state.rooms.filter((r) => r.status === "cleaning").length, color: "bg-purple-50 text-purple-800 border-purple-300" },
            { label: "Inspection", count: inspectionRoomsCount, color: "bg-indigo-50 text-indigo-800 border-indigo-300" },
            { label: "Maintenance", count: maintenanceRoomsCount, color: "bg-orange-50 text-orange-800 border-orange-300" },
            { label: "Blocked", count: blockedRoomsCount, color: "bg-zinc-100 text-zinc-800 border-zinc-300" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-2.5 text-center transition hover:shadow-sm ${item.color}`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">{item.label}</span>
              <span className="font-display text-xl font-bold">{item.count}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* 4. Operational Tables: Today's Arrivals & Today's Departures */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Today's Arrivals Section */}
        <Panel
          title="Today's Arrivals"
          subtitle={`${todaysArrivals.length} guests scheduled to check in today (${formatDate(today)})`}
          action={
            <Link
              to="/reception/check-in"
              className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
            >
              Arrivals Desk <ArrowRight className="size-3" />
            </Link>
          }
        >
          {todaysArrivals.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No arrivals in queue"
              text="All scheduled arrivals for today have already completed check-in."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gold/20">
              <table className="w-full text-left text-xs bg-white">
                <thead className="border-b border-gold/20 bg-[#FAF7F2] text-[#061830] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Guest &amp; ID</th>
                    <th className="py-2.5 px-3">Category / Room</th>
                    <th className="py-2.5 px-3">Guests</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-[#061830]">
                  {todaysArrivals.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-gold/5 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-[#061830]">{b.guestName}</p>
                        <span className="text-[10px] text-[#64748b] font-mono">{b.id}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium">{getCategory(state, b.categoryId)?.name}</p>
                        <span className="rounded bg-navy-deep/10 px-1.5 py-0.5 text-[10px] font-bold text-[#061830]">
                          Room {b.roomNumber || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{b.guests} Guests</td>
                      <td className="py-2.5 px-3">
                        <PaymentBadge status={b.payment} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleQuickCheckIn(e, b)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                        >
                          <LogIn className="size-3" /> Check-in
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Today's Departures Section */}
        <Panel
          title="Today's Departures"
          subtitle={`${todaysDepartures.length} guests scheduled to depart today (${formatDate(today)})`}
          action={
            <Link
              to="/reception/check-out"
              className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
            >
              Departures Desk <ArrowRight className="size-3" />
            </Link>
          }
        >
          {todaysDepartures.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending departures"
              text="No guests in-house are scheduled to depart today."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gold/20">
              <table className="w-full text-left text-xs bg-white">
                <thead className="border-b border-gold/20 bg-[#FAF7F2] text-[#061830] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Room &amp; Guest</th>
                    <th className="py-2.5 px-3">Booking ID</th>
                    <th className="py-2.5 px-3">Pending Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-[#061830]">
                  {todaysDepartures.map((b) => {
                    const balance = Math.max(0, b.total - b.amountPaid);
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className="hover:bg-gold/5 transition cursor-pointer"
                      >
                        <td className="py-2.5 px-3">
                          <span className="rounded bg-[#061830] px-2 py-0.5 text-xs font-bold text-gold mr-2">
                            #{b.roomNumber || "—"}
                          </span>
                          <span className="font-bold text-[#061830]">{b.guestName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748b]">
                          {b.id}
                        </td>
                        <td className="py-2.5 px-3">
                          {balance > 0 ? (
                            <span className="font-bold text-rose-600">{formatINR(balance)}</span>
                          ) : (
                            <span className="font-bold text-emerald-600">Settled (₹0)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => handleQuickCheckOut(e, b)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-sm"
                          >
                            <LogOut className="size-3" /> Check-out
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* 5. Recent Reception Activities & Audit Log Feed */}
      <Panel
        title="Recent Front Desk Activities"
        subtitle="Chronological feed of bookings, check-ins, check-outs, room turnover, and payment collections"
      >
        <div className="space-y-2.5">
          {(state.auditLogs || []).slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gold/15 bg-white p-3 text-xs shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-gold/15 text-gold shrink-0">
                  <Clock className="size-4" />
                </span>
                <div>
                  <p className="font-bold text-[#061830]">{log.details}</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">
                    Module: <span className="font-semibold text-gold">{log.module}</span> · By: {log.userName || log.userEmail}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-[#64748b] shrink-0">
                {formatDate(log.createdAt || today)}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Booking Details Modal */}
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
