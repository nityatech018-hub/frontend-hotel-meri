import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  DoorOpen,
  IndianRupee,
  LogIn,
  LogOut,
  ClipboardList,
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
import { EmptyState, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { addDays, formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import { revenueByDay } from "@/lib/hotel/reports.js";
import {
  checkInBooking,
  checkOutBooking,
  freeRoomsFor,
  getCategory,
  occupiedRoomNumbers,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#0B1528",
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: "0.75rem",
    color: "#F4F1EA",
    fontSize: "12px",
  },
};

export default function ReceptionOverview() {
  const state = useHotelState();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const today = todayISO();
  const occ = occupiedRoomNumbers(state);
  const total = state.rooms.length;
  const outOfService = state.rooms.filter(
    (r) => r.status !== "available" && !occ.has(r.number)
  ).length;
  const available = total - occ.size - outOfService;
  const arrivals = state.bookings.filter(
    (b) => b.checkIn === today && (b.status === "Confirmed" || b.status === "Pending")
  );
  const departures = state.bookings.filter(
    (b) => b.checkOut === today && b.status === "Checked-In"
  );
  const activeBookings = state.bookings.filter((b) => b.status !== "Cancelled").length;
  const month = today.slice(0, 7);
  const monthRevenue = revenueByDay(state.bookings, `${month}-01`, 31)
    .filter((d) => d.date.startsWith(month))
    .reduce((n, d) => n + d.revenue, 0);

  const trend = revenueByDay(state.bookings, addDays(today, -20), 21).map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  const byCat = state.categories.map((c) => {
    const rooms = state.rooms.filter((r) => r.categoryId === c.id);
    const o = rooms.filter((r) => occ.has(r.number)).length;
    return { name: c.name.replace(" Room", ""), occupied: o, free: rooms.length - o };
  });

  const sources = ["Website", "Walk-in", "Phone"].map((s) => ({
    name: s,
    value: state.bookings.filter((b) => b.source === s).length,
  }));

  const COLORS = ["#D4AF37", "#1E3A8A", "#10B981"];
  const recent = [...state.bookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const handleQuickCheckIn = (e, b) => {
    e.stopPropagation();
    const free = freeRoomsFor(state, b.categoryId);
    const roomToAssign = b.roomNumber && free.includes(b.roomNumber) ? b.roomNumber : free[0];
    if (!roomToAssign) {
      toast.error(`No free rooms in ${getCategory(state, b.categoryId)?.name || "category"}! Please reassign.`);
      setSelectedBooking(b);
      return;
    }
    checkInBooking(b.id, roomToAssign);
    toast.success(`${b.guestName} checked in to Room ${roomToAssign}!`);
  };

  const handleQuickCheckOut = (e, b) => {
    e.stopPropagation();
    const bal = Math.max(0, b.total - b.amountPaid);
    if (bal > 0) {
      toast.info(`Guest has an outstanding balance of ${formatINR(bal)}. Reviewing folio...`);
      setSelectedBooking(b);
      return;
    }
    checkOutBooking(b.id);
    toast.success(`${b.guestName} successfully checked out!`);
  };

  return (
    <div className="space-y-6">
      {/* Front Desk Fast Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/20 bg-navy-card/60 p-3 sm:p-4 backdrop-blur-md">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5 mr-1">
          <CalendarCheck className="size-4" /> Quick Desk:
        </span>
        <Link
          to="/reception/check-in"
          className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-navy-deep px-3.5 py-2 text-xs font-medium text-navy-foreground hover:border-gold hover:text-gold transition shadow-sm"
        >
          <LogIn className="size-3.5 text-emerald-400" />
          <span>Arrivals Desk</span>
          {arrivals.length > 0 && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              {arrivals.length} Due
            </span>
          )}
        </Link>
        <Link
          to="/reception/check-out"
          className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-navy-deep px-3.5 py-2 text-xs font-medium text-navy-foreground hover:border-gold hover:text-gold transition shadow-sm"
        >
          <LogOut className="size-3.5 text-rose-400" />
          <span>Departures Desk</span>
          {departures.length > 0 && (
            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
              {departures.length} Due
            </span>
          )}
        </Link>
        <Link
          to="/reception/payments"
          className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-navy-deep px-3.5 py-2 text-xs font-medium text-navy-foreground hover:border-gold hover:text-gold transition shadow-sm"
        >
          <IndianRupee className="size-3.5 text-gold" />
          <span>Payments &amp; Folios</span>
        </Link>
        <Link
          to="/reception/new"
          className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-gradient px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold-foreground hover:brightness-110 transition shadow-sm sm:ml-auto"
        >
          <span>+ New Walk-In Booking</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={BedDouble}
          label="Total rooms"
          value={total}
          hint={`${outOfService} in maintenance`}
          tone="default"
        />
        <StatCard
          icon={DoorOpen}
          label="Available rooms"
          value={available}
          hint="Ready to assign"
          tone="emerald"
        />
        <StatCard
          icon={CalendarCheck}
          label="Occupied rooms"
          value={occ.size}
          hint={`${Math.round((occ.size / (total || 1)) * 100)}% occupancy`}
          tone="gold"
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue this month"
          value={`₹${monthRevenue.toLocaleString("en-IN")}`}
          hint="Calculated from stays"
          tone="gold"
        />
        <StatCard
          icon={LogIn}
          label="Today's check-ins"
          value={arrivals.length}
          tone="gold"
        />
        <StatCard
          icon={LogOut}
          label="Today's check-outs"
          value={departures.length}
          tone="default"
        />
        <StatCard
          icon={ClipboardList}
          label="Active bookings"
          value={activeBookings}
          hint={`${state.bookings.length - activeBookings} cancelled`}
          tone="default"
        />
        <StatCard
          icon={IndianRupee}
          label="Balance due"
          value={`₹${state.bookings
            .filter((b) => b.status !== "Cancelled")
            .reduce((n, b) => n + Math.max(0, b.total - b.amountPaid), 0)
            .toLocaleString("en-IN")}`}
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Revenue Overview"
          subtitle="Room revenue per night — last 3 weeks"
          className="xl:col-span-2"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243354" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                  width={45}
                />
                <Tooltip {...tooltipStyle} formatter={(v) => [formatINR(v), "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Booking Sources" subtitle="Breakdown by origin">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {sources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            {sources.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-navy-foreground/70">
                <span className="size-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {s.name} · {s.value}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Occupancy by Category" subtitle="Current room allocation">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCat} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="occupied" stackId="a" fill="#D4AF37" radius={[4, 0, 0, 4]} />
                <Bar dataKey="free" stackId="a" fill="#243354" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Today's Movements"
          action={
            <Link
              to="/reception/check-in"
              className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
            >
              Check-In Desk <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {arrivals.length + departures.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="A quiet day"
              text="No arrivals or departures scheduled for today."
            />
          ) : (
            <ul className="space-y-2.5 text-xs">
              {[
                ...arrivals.map((b) => ({ b, kind: "in" })),
                ...departures.map((b) => ({ b, kind: "out" })),
              ].map(({ b, kind }) => (
                <li
                  key={b.id + kind}
                  onClick={() => setSelectedBooking(b)}
                  className="flex items-center gap-3 rounded-xl border border-gold/15 bg-navy-deep/40 p-3 hover:border-gold/50 hover:bg-white/5 transition cursor-pointer"
                >
                  <span
                    className={`grid size-8 place-items-center rounded-lg ${
                      kind === "in"
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-950/40 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {kind === "in" ? <LogIn className="size-4" /> : <LogOut className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-foreground">{b.guestName}</p>
                    <p className="text-[11px] text-navy-foreground/60">
                      {getCategory(state, b.categoryId)?.name || "Room"}
                      {b.roomNumber ? ` · Room ${b.roomNumber}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                  {kind === "in" && (b.status === "Confirmed" || b.status === "Pending") && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickCheckIn(e, b)}
                      className="shrink-0 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition shadow-sm"
                      title="Quick Check-In"
                    >
                      Check In
                    </button>
                  )}
                  {kind === "out" && b.status === "Checked-In" && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickCheckOut(e, b)}
                      className="shrink-0 rounded-lg bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/30 transition shadow-sm"
                      title="Quick Check-Out"
                    >
                      Check Out
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent Bookings"
          action={
            <Link
              to="/reception/bookings"
              className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
            >
              All Bookings <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          <ul className="space-y-2.5 text-xs">
            {recent.map((b) => (
              <li
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="flex items-center justify-between gap-3 border-b border-gold/10 pb-2.5 last:border-0 hover:bg-white/5 p-1 rounded-lg transition cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy-foreground">{b.guestName}</p>
                  <p className="text-[11px] text-navy-foreground/60">
                    {b.id} · {formatDate(b.checkIn)}
                  </p>
                </div>
                <span className="font-semibold text-gold">{formatINR(b.total)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {selectedBooking && (
        <BookingDialog
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
