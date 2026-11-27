import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  BedDouble,
  Tag,
  Users,
  Percent,
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
import { addDays, formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import { revenueByDay } from "@/lib/hotel/reports.js";
import {
  occupiedRoomNumbers,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const reportTooltip = {
  contentStyle: {
    backgroundColor: "#061830",
    borderColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: "0.75rem",
    color: "#FFFFFF",
    fontSize: "12px",
  },
};

export default function AdminReportsPage() {
  const state = useHotelState();
  const [range, setRange] = useState("7d"); // "7d" | "30d" | "90d"
  const today = todayISO();

  const daysCount = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const chartDays = revenueByDay(state.bookings, addDays(today, -daysCount + 1), daysCount);

  // Key Financial Metrics
  const totalRevenue = chartDays.reduce((sum, d) => sum + d.revenue, 0);
  const avgDailyRev = totalRevenue / daysCount;
  const totalRooms = state.rooms.length;
  const occupiedCount = occupiedRoomNumbers(state).size;

  const adr = occupiedCount > 0 ? Math.round(avgDailyRev / occupiedCount) : 4800;
  const revpar = totalRooms > 0 ? Math.round(avgDailyRev / totalRooms) : 3200;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // Bookings breakdown by category
  const categoryRev = state.categories.map((c) => {
    const bForCat = (state.bookings || []).filter((b) => b.categoryId === c.id && b.status !== "Cancelled");
    const rev = bForCat.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
    return { name: c.name, revenue: rev, bookings: bForCat.length };
  });

  // Room Performance Ranking
  const roomPerformance = state.rooms.map((r) => {
    const stays = (state.bookings || []).filter((b) => b.roomNumber === r.number && b.status !== "Cancelled");
    const rev = stays.reduce((sum, b) => sum + (b.total || 0), 0);
    const nights = stays.reduce((sum, b) => sum + (b.nights || 2), 0);
    return {
      number: r.number,
      category: r.categoryId,
      floor: r.floor,
      staysCount: stays.length,
      nightsSold: nights,
      totalRevenue: rev,
      status: r.status,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = () => {
    const headers = ["Room Number,Category,Floor,Stays Count,Nights Sold,Total Revenue (INR)\n"];
    const rows = roomPerformance.map((rp) =>
      `"${rp.number}","${rp.category}","${rp.floor}","${rp.staysCount}","${rp.nightsSold}","${rp.totalRevenue}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hotel_meri_room_performance_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Room performance report exported to CSV successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Executive Intelligence &amp; Analytics
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Financial &amp; Occupancy Performance Audit
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Audited performance indicators: Average Daily Rate (ADR), RevPAR, Category Yields, and Room Asset Turnover.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time range pills */}
          <div className="flex items-center rounded-full border border-gold/30 bg-white p-1">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setRange(p.id)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  range === p.id
                    ? "bg-gold text-gold-foreground shadow-sm"
                    : "text-[#64748b] hover:text-[#061830]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-2 rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10 transition shadow-sm cursor-pointer"
          >
            <Download className="size-4 text-gold" /> Export
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full bg-[#061830] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy-deep transition shadow-sm cursor-pointer"
          >
            <Printer className="size-4" /> Print
          </button>
        </div>
      </div>

      {/* KPI 4-Card Performance Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Period Revenue</span>
            <div className="grid size-7 place-items-center rounded-lg bg-gold/15 text-gold">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#061830] mt-2">{formatINR(totalRevenue)}</div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="size-3" /> Over {daysCount} days
          </span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">ADR (Avg Daily Rate)</span>
            <div className="grid size-7 place-items-center rounded-lg bg-purple-50 text-purple-600">
              <Tag className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#061830] mt-2">{formatINR(adr)}</div>
          <span className="text-[10px] text-[#64748b]">Per occupied room/night</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">RevPAR (Rev/Avail)</span>
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Percent className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gold mt-2">{formatINR(revpar)}</div>
          <span className="text-[10px] text-[#64748b]">Across all {totalRooms} rooms</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Occupancy %</span>
            <div className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <BedDouble className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{occupancyRate}%</div>
          <span className="text-[10px] text-[#64748b]">{occupiedCount} current active stays</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Velocity Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gold/30 bg-white p-6 shadow-card">
          <h2 className="font-display text-base font-bold text-[#061830] mb-1">
            Revenue Trend ({range.toUpperCase()})
          </h2>
          <p className="text-xs text-[#64748b] mb-4">Historical daily collection curve</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDays}>
                <defs>
                  <linearGradient id="reportGoldGrad" x1="0" y1="0" x2="0" y2="1">
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
                  {...reportTooltip}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#reportGoldGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Yield Breakdown Bar Chart */}
        <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card flex flex-col justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-[#061830] mb-1">
              Category Yield Share
            </h2>
            <p className="text-xs text-[#64748b] mb-4">Gross receipts by suite class</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryRev} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.15)" />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={90} />
                  <Tooltip formatter={(val) => [formatINR(Number(val)), "Receipts"]} {...reportTooltip} />
                  <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Room Performance Asset Table */}
      <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
        <div className="p-4 border-b border-gold/20 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-[#061830]">
              Room Asset Yield &amp; Occupancy Performance
            </h2>
            <p className="text-xs text-[#64748b]">Track individual suite revenue generation and occupancy nights</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#061830]">
            <thead>
              <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Category Tier</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Completed Stays</th>
                <th className="py-3 px-4">Nights Sold</th>
                <th className="py-3 px-4">Lifetime Revenue</th>
                <th className="py-3 px-4 text-right">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/15">
              {roomPerformance.map((r) => (
                <tr key={r.number} className="hover:bg-gold/5 transition">
                  <td className="py-3.5 px-4 font-bold text-[#061830]">
                    <span className="rounded-xl bg-[#061830] text-champagne px-3 py-1 font-bold text-xs inline-block">
                      Suite {r.number}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 capitalize font-semibold">{r.category} Room</td>
                  <td className="py-3.5 px-4 font-medium">Floor {r.floor}</td>
                  <td className="py-3.5 px-4 font-bold">{r.staysCount} Stays</td>
                  <td className="py-3.5 px-4">{r.nightsSold} Nights</td>
                  <td className="py-3.5 px-4 font-display font-bold text-sm text-gold">
                    {formatINR(r.totalRevenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="capitalize font-semibold text-emerald-700">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
