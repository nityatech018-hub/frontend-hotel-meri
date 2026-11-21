import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { Panel } from "@/components/dashboard/ui.jsx";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { addDays, formatDate, parseISODate, todayISO } from "@/lib/hotel/pricing.js";
import { roomsBookedOn } from "@/lib/hotel/reports.js";
import { getCategory, useHotelState } from "@/lib/hotel/store.jsx";

const DAYS = 14;

export default function ReceptionCalendar() {
  const state = useHotelState();
  const today = todayISO();
  const [start, setStart] = useState(today);
  const [day, setDay] = useState(today);
  const [edit, setEdit] = useState(null);

  const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i));
  const onDay = state.bookings.filter(
    (b) => b.status !== "Cancelled" && b.checkIn <= day && day < b.checkOut
  );
  const arriving = state.bookings.filter((b) => b.status !== "Cancelled" && b.checkIn === day);

  return (
    <div className="space-y-6">
      <Panel
        title="Availability & Occupancy Calendar"
        subtitle="Rooms booked per category per night · Select any day to inspect in-house guests and arrivals"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStart(addDays(start, -7))}
              className="rounded-lg border border-gold/30 p-2 text-champagne hover:bg-white/5 transition"
              title="Previous Week"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => {
                setStart(today);
                setDay(today);
              }}
              className="rounded-lg border border-gold/30 px-3 py-1.5 text-xs font-semibold uppercase text-gold hover:bg-white/5 transition"
            >
              Today
            </button>
            <button
              onClick={() => setStart(addDays(start, 7))}
              className="rounded-lg border border-gold/30 p-2 text-champagne hover:bg-white/5 transition"
              title="Next Week"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="w-32 text-left font-semibold uppercase tracking-wider text-gold pb-2">
                  Category
                </th>
                {days.map((d) => {
                  const dt = parseISODate(d);
                  const isSelected = d === day;
                  const isToday = d === today;

                  return (
                    <th key={d} className="pb-2">
                      <button
                        onClick={() => setDay(d)}
                        className={`w-full rounded-xl py-2 transition ${
                          isSelected
                            ? "bg-gold text-gold-foreground font-bold shadow-gold"
                            : isToday
                            ? "border border-gold text-gold font-semibold"
                            : "text-navy-foreground/60 hover:bg-white/5"
                        }`}
                      >
                        <span className="block text-[10px] uppercase">
                          {dt.toLocaleDateString("en-IN", { weekday: "short" })}
                        </span>
                        <span className="font-display text-sm font-semibold">{dt.getDate()}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {state.categories.map((c) => {
                const total = state.rooms.filter(
                  (r) => r.categoryId === c.id && r.status !== "maintenance"
                ).length;

                return (
                  <tr key={c.id}>
                    <td className="pr-2 py-1 font-medium text-navy-foreground">
                      {c.name}
                      <span className="block text-[10px] text-navy-foreground/50">{total} rooms</span>
                    </td>
                    {days.map((d) => {
                      const used = roomsBookedOn(state.bookings, d, c.id);
                      const pct = total ? Math.min(1, used / total) : 1;

                      let cellStyle = "bg-navy-deep/80 text-navy-foreground/50 border border-gold/10";
                      if (pct >= 1) {
                        cellStyle = "bg-rose-950/70 border border-rose-500/40 text-rose-300 font-bold";
                      } else if (pct >= 0.6) {
                        cellStyle = "bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold";
                      } else if (pct > 0) {
                        cellStyle = "bg-emerald-950/50 border border-emerald-500/30 text-emerald-300";
                      }

                      return (
                        <td key={d} className="py-1">
                          <button
                            onClick={() => setDay(d)}
                            title={`${used}/${total} booked`}
                            className={`grid h-10 w-full place-items-center rounded-xl font-medium transition hover:scale-105 ${cellStyle} ${
                              d === day ? "ring-2 ring-gold" : ""
                            }`}
                          >
                            {used}/{total}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-xs text-navy-foreground/70 border-t border-gold/15 pt-4">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-navy-deep border border-gold/10" /> 0 booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-emerald-950/50 border border-emerald-500/30" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-amber-950/70 border border-amber-500/40" /> Filling up
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-rose-950/70 border border-rose-500/40" /> Fully booked
          </span>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          key={"stay" + day}
          title={`In House on ${formatDate(day)}`}
          subtitle={`${onDay.length} active stays on this date`}
        >
          <BookingList items={onDay} onOpen={setEdit} />
        </Panel>

        <Panel
          key={"arr" + day}
          title={`Arrivals on ${formatDate(day)}`}
          subtitle={`${arriving.length} check-ins scheduled`}
        >
          <BookingList items={arriving} onOpen={setEdit} />
        </Panel>
      </div>

      <BookingDialog booking={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function BookingList({ items, onOpen }) {
  const state = useHotelState();

  if (!items.length) {
    return (
      <p className="py-8 text-center text-xs text-navy-foreground/50">
        No guest reservations found for this date.
      </p>
    );
  }

  return (
    <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
      {items.map((b) => (
        <li key={b.id}>
          <button
            onClick={() => onOpen(b)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-gold/15 bg-navy-deep/40 p-3 text-left transition hover:border-gold hover:bg-white/5"
          >
            <div>
              <p className="font-semibold text-xs text-navy-foreground">{b.guestName}</p>
              <p className="text-[11px] text-navy-foreground/60">
                {getCategory(state, b.categoryId)?.name}
                {b.roomNumber ? ` · Room ${b.roomNumber}` : ""} · ID: {b.id}
              </p>
            </div>
            <StatusBadge status={b.status} />
          </button>
        </li>
      ))}
    </ul>
  );
}
