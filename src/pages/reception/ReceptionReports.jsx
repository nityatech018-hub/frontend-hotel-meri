import React, { useState } from "react";
import { BedDouble, CalendarRange, IndianRupee, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterChips, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { addDays, formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import { revenueByDay, roomsBookedOn } from "@/lib/hotel/reports.js";
import { useHotelState } from "@/lib/hotel/store.jsx";

const RANGES = ["Daily", "Weekly", "Monthly"];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#0B1528",
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: "0.75rem",
    color: "#F4F1EA",
    fontSize: "12px",
  },
};

export default function ReceptionReports() {
  const state = useHotelState();
  const today = todayISO();
  const [range, setRange] = useState("Daily");

  const span = range === "Daily" ? 14 : range === "Weekly" ? 12 * 7 : 90;
  const from = addDays(today, -(span - 1));
  const days = revenueByDay(state.bookings, from, span);
  const totalRooms = state.rooms.filter((r) => r.status !== "maintenance").length || 20;

  let points;
  if (range === "Daily") {
    points = days.map((d) => ({
      label: formatDate(d.date),
      revenue: d.revenue,
      bookings: d.bookings,
      occupancy: Math.round(
        (roomsBookedOn(
          state.bookings.map((b) =>
            b.status === "Checked-Out" ? { ...b, status: "Confirmed" } : b
          ),
          d.date
        ) /
          totalRooms) *
          100
      ),
    }));
  } else {
    const groups = new Map();
    for (const d of days) {
      const key =
        range === "Weekly"
          ? addDays(from, Math.floor(days.indexOf(d) / 7) * 7)
          : d.date.slice(0, 7);
      const label =
        range === "Weekly"
          ? `Wk ${formatDate(key)}`
          : key;
      const g = groups.get(key) || { label, revenue: 0, bookings: 0, occupancy: 0, n: 0 };
      g.revenue += d.revenue;
      g.bookings += d.bookings;
      g.occupancy +=
        roomsBookedOn(
          state.bookings.map((b) =>
            b.status === "Checked-Out" ? { ...b, status: "Confirmed" } : b
          ),
          d.date
        ) / totalRooms;
      g.n++;
      groups.set(key, g);
    }
    points = [...groups.values()].map((g) => ({
      label: g.label,
      revenue: g.revenue,
      bookings: g.bookings,
      occupancy: Math.round((g.occupancy / g.n) * 100),
    }));
  }

  const revenue = points.reduce((n, p) => n + p.revenue, 0);
  const bookings = points.reduce((n, p) => n + p.bookings, 0);
  const occ = Math.round(points.reduce((n, p) => n + p.occupancy, 0) / Math.max(1, points.length));

  const byCat = state.categories.map((c) => ({
    name: c.name,
    revenue: revenueByDay(
      state.bookings.filter((b) => b.categoryId === c.id),
      from,
      span
    ).reduce((n, d) => n + d.revenue, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-navy-foreground/70">
          <CalendarRange className="mr-1.5 inline size-4 text-gold" /> {formatDate(from)} —{" "}
          {formatDate(today)}
        </p>
        <FilterChips options={RANGES} value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Period Revenue"
          value={`₹${revenue.toLocaleString("en-IN")}`}
          tone="gold"
        />
        <StatCard icon={TrendingUp} label="Arrivals" value={bookings} tone="emerald" />
        <StatCard
          icon={BedDouble}
          label="Avg Occupancy"
          value={`${occ}%`}
          hint="% of serviceable rooms"
          tone="default"
        />
        <StatCard
          icon={IndianRupee}
          label="Avg Per Day"
          value={`₹${Math.round(revenue / (span || 1)).toLocaleString("en-IN")}`}
          tone="gold"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title={`${range} Revenue Trajectory`} className="xl:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points}>
                <defs>
                  <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F4F1EA" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243354" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                  width={48}
                />
                <Tooltip
                  {...tooltipStyle}
                  cursor={{ fill: "rgba(212, 175, 55, 0.05)" }}
                  formatter={(v) => [formatINR(v), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="url(#barGold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenue by Room Type">
          <ul className="space-y-4 text-xs">
            {byCat
              .sort((a, b) => b.revenue - a.revenue)
              .map((c) => {
                const max = Math.max(...byCat.map((x) => x.revenue), 1);
                return (
                  <li key={c.name}>
                    <div className="flex justify-between font-medium">
                      <span className="text-navy-foreground">{c.name}</span>
                      <span className="text-gold font-semibold">{formatINR(c.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-deep border border-gold/15">
                      <div
                        className="h-full rounded-full bg-gold-gradient transition-all duration-1000"
                        style={{ width: `${(c.revenue / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Occupancy &amp; Check-In Correlation"
        subtitle="Tracking occupancy percentage alongside guest check-in volume"
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243354" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="occupancy"
                name="Occupancy %"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                name="Check-Ins"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={{ r: 3, fill: "#D4AF37" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
