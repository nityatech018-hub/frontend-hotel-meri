import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, Search, BedDouble, UserRound, Sparkles, Wrench, ShieldAlert, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { addDays, formatDate, parseISODate, todayISO } from "@/lib/hotel/pricing.js";
import { roomsBookedOn } from "@/lib/hotel/reports.js";
import { getCategory, useHotelState } from "@/lib/hotel/store.jsx";

export default function ReceptionCalendar() {
  const state = useHotelState();
  const navigate = useNavigate();
  const today = todayISO();
  const [viewMode, setViewMode] = useState("timeline"); // 'timeline' | 'category'
  const [spanDays, setSpanDays] = useState(14); // 7 | 14 | 28
  const [start, setStart] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchGuest, setSearchGuest] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const days = Array.from({ length: spanDays }, (_, i) => addDays(start, i));

  // Filtered rooms
  const filteredRooms = state.rooms.filter(
    (r) => categoryFilter === "all" || r.categoryId === categoryFilter
  );

  const term = searchGuest.trim().toLowerCase();

  // On selected day bookings
  const onSelectedDay = state.bookings.filter(
    (b) => b.status !== "Cancelled" && b.checkIn <= selectedDate && selectedDate < b.checkOut
  );
  const arrivingOnDay = state.bookings.filter(
    (b) => b.status !== "Cancelled" && b.checkIn === selectedDate
  );

  const handleCellClick = (room, date) => {
    // Check if room is booked on this date
    const bookingOnDate = state.bookings.find(
      (b) =>
        b.status !== "Cancelled" &&
        b.roomNumber === room.number &&
        b.checkIn <= date &&
        date < b.checkOut
    );

    if (bookingOnDate) {
      setSelectedBooking(bookingOnDate);
    } else {
      // Empty slot: navigate to new booking prefilled
      navigate(`/reception/new?room=${room.number}&checkIn=${date}&category=${room.categoryId}`);
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Interactive Front Desk Booking &amp; Room Timeline Calendar"
        subtitle="Visual room-by-room timeline · Track occupied, reserved, maintenance and available room periods"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher */}
            <div className="flex rounded-xl bg-[#FAF7F2] p-1 border border-gold/30">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  viewMode === "timeline"
                    ? "bg-gold text-gold-foreground shadow-sm"
                    : "text-[#64748b] hover:text-[#061830]"
                }`}
              >
                Room Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode("category")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  viewMode === "category"
                    ? "bg-gold text-gold-foreground shadow-sm"
                    : "text-[#64748b] hover:text-[#061830]"
                }`}
              >
                Category Matrix
              </button>
            </div>

            {/* Days span selector */}
            <div className="flex items-center gap-1 text-xs font-semibold">
              {[7, 14, 21].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSpanDays(n)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    spanDays === n
                      ? "bg-gold text-gold-foreground"
                      : "border border-gold/30 bg-[#FAF7F2] text-[#061830]"
                  }`}
                >
                  {n}D
                </button>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStart(addDays(start, -7))}
                className="rounded-lg border border-gold/30 bg-[#FAF7F2] p-1.5 text-[#061830] hover:bg-gold/15 transition cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => {
                  setStart(today);
                  setSelectedDate(today);
                }}
                className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-3 py-1 text-xs font-bold uppercase text-[#061830] hover:bg-gold/15 transition cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setStart(addDays(start, 7))}
                className="rounded-lg border border-gold/30 bg-[#FAF7F2] p-1.5 text-[#061830] hover:bg-gold/15 transition cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        }
      >
        {/* Filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748b] font-medium">Filter Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#061830] font-medium"
            >
              <option value="all">All 5 Room Categories</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gold" />
            <input
              type="text"
              placeholder="Search guest in calendar..."
              value={searchGuest}
              onChange={(e) => setSearchGuest(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] placeholder:text-[#64748b] focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        {/* View Mode 1: Room-Wise Timeline (Interactive) */}
        {viewMode === "timeline" ? (
          <div className="overflow-x-auto rounded-xl border border-gold/25">
            <table className="w-full min-w-[960px] border-collapse text-xs bg-white">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-gold/20 text-[#061830]">
                  <th className="w-36 py-2.5 px-3 text-left font-bold uppercase tracking-wider text-gold sticky left-0 bg-[#FAF7F2] z-10 border-r border-gold/20">
                    Room
                  </th>
                  {days.map((d) => {
                    const dt = parseISODate(d);
                    const isToday = d === today;
                    const isSel = d === selectedDate;
                    return (
                      <th
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`py-2 px-1 text-center font-bold cursor-pointer transition ${
                          isSel
                            ? "bg-gold text-gold-foreground"
                            : isToday
                            ? "bg-gold/15 text-gold"
                            : "hover:bg-gold/10 text-[#64748b]"
                        }`}
                      >
                        <span className="block text-[9px] uppercase font-semibold">
                          {dt.toLocaleDateString("en-IN", { weekday: "short" })}
                        </span>
                        <span className="font-display text-sm font-bold">{dt.getDate()}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {filteredRooms.map((r) => {
                  return (
                    <tr key={r.number} className="hover:bg-gold/5 transition">
                      <td className="py-2 px-3 font-semibold text-[#061830] sticky left-0 bg-white z-10 border-r border-gold/20">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-[#061830] px-1.5 py-0.5 font-display text-xs font-bold text-gold">
                            {r.number}
                          </span>
                          <span className="text-[10px] text-[#64748b] truncate max-w-[80px]">
                            {getCategory(state, r.categoryId)?.name.replace(" Room", "")}
                          </span>
                        </div>
                      </td>

                      {days.map((d) => {
                        // Check if room has an active booking on this date
                        const booking = state.bookings.find(
                          (b) =>
                            b.status !== "Cancelled" &&
                            b.roomNumber === r.number &&
                            b.checkIn <= d &&
                            d < b.checkOut
                        );

                        const isHighlighted = term && booking && booking.guestName.toLowerCase().includes(term);

                        // If room is under maintenance
                        if (r.status === "maintenance" && !booking) {
                          return (
                            <td key={d} className="p-1 text-center">
                              <div
                                title="Room Under Maintenance"
                                className="h-8 rounded bg-rose-50 border border-rose-300 text-rose-700 flex items-center justify-center text-[10px] font-bold"
                              >
                                <Wrench className="size-3" />
                              </div>
                            </td>
                          );
                        }

                        // If room is blocked
                        if (r.status === "blocked" && !booking) {
                          return (
                            <td key={d} className="p-1 text-center">
                              <div
                                title="Room Blocked"
                                className="h-8 rounded bg-zinc-100 border border-zinc-300 text-zinc-700 flex items-center justify-center text-[10px] font-bold"
                              >
                                <ShieldAlert className="size-3" />
                              </div>
                            </td>
                          );
                        }

                        if (booking) {
                          const isCheckInDay = booking.checkIn === d;
                          const isOccupied = booking.status === "Checked-In";
                          return (
                            <td key={d} className="p-1">
                              <button
                                type="button"
                                onClick={() => setSelectedBooking(booking)}
                                title={`${booking.guestName} (#${booking.id}) · ${booking.status}`}
                                className={`w-full h-8 rounded px-1 text-[10px] font-bold truncate transition cursor-pointer flex items-center justify-center ${
                                  isOccupied
                                    ? "bg-blue-600 text-white"
                                    : "bg-amber-400 text-navy-deep font-bold"
                                } ${isHighlighted ? "ring-2 ring-gold scale-105" : ""}`}
                              >
                                {isCheckInDay ? "▶ " : ""}{booking.guestName.split(" ")[0]}
                              </button>
                            </td>
                          );
                        }

                        // Empty vacant slot
                        return (
                          <td key={d} className="p-1">
                            <button
                              type="button"
                              onClick={() => handleCellClick(r, d)}
                              title={`Room ${r.number} Vacant on ${d}. Click to book.`}
                              className="w-full h-8 rounded border border-gold/15 bg-emerald-50/40 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 transition flex items-center justify-center group cursor-pointer"
                            >
                              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold">+</span>
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
        ) : (
          /* View Mode 2: Category Heat Matrix */
          <div className="overflow-x-auto rounded-xl border border-gold/25">
            <table className="w-full min-w-[900px] border-collapse text-xs bg-white">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-gold/20 text-[#061830]">
                  <th className="w-36 py-2.5 px-3 text-left font-bold uppercase tracking-wider text-gold">
                    Category
                  </th>
                  {days.map((d) => {
                    const dt = parseISODate(d);
                    const isSelected = d === selectedDate;
                    const isToday = d === today;
                    return (
                      <th
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`py-2 px-1 text-center font-bold cursor-pointer transition ${
                          isSelected
                            ? "bg-gold text-gold-foreground font-bold shadow-sm"
                            : isToday
                            ? "bg-gold/15 text-gold font-bold"
                            : "hover:bg-gold/10 text-[#64748b]"
                        }`}
                      >
                        <span className="block text-[9px] uppercase font-semibold">
                          {dt.toLocaleDateString("en-IN", { weekday: "short" })}
                        </span>
                        <span className="font-display text-sm font-bold">{dt.getDate()}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {state.categories.map((c) => {
                  const totalInCat = state.rooms.filter(
                    (r) => r.categoryId === c.id && r.status !== "maintenance"
                  ).length;

                  return (
                    <tr key={c.id} className="hover:bg-gold/5 transition">
                      <td className="py-2.5 px-3 font-bold text-[#061830]">
                        {c.name}
                        <span className="block text-[10px] text-[#64748b] font-normal">
                          {totalInCat} rooms
                        </span>
                      </td>
                      {days.map((d) => {
                        const used = roomsBookedOn(state.bookings, d, c.id);
                        const pct = totalInCat ? Math.min(1, used / totalInCat) : 1;

                        let cellStyle = "bg-[#FAF7F2] text-[#64748b] border border-gold/20";
                        if (pct >= 1) {
                          cellStyle = "bg-rose-100 border border-rose-300 text-rose-800 font-bold";
                        } else if (pct >= 0.6) {
                          cellStyle = "bg-amber-100 border border-amber-300 text-amber-800 font-bold";
                        } else if (pct > 0) {
                          cellStyle = "bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold";
                        }

                        return (
                          <td key={d} className="p-1">
                            <button
                              type="button"
                              onClick={() => setSelectedDate(d)}
                              title={`${used}/${totalInCat} booked on ${d}`}
                              className={`h-9 w-full rounded-lg font-bold transition flex items-center justify-center cursor-pointer ${cellStyle} ${
                                d === selectedDate ? "ring-2 ring-gold" : ""
                              }`}
                            >
                              {used}/{totalInCat}
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
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#061830] font-medium border-t border-gold/15 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-blue-600" /> In-House (Checked-In)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-amber-400" /> Confirmed / Reserved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-emerald-100 border border-emerald-300" /> Available (Click to book)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-rose-100 border border-rose-300" /> Maintenance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-zinc-200 border border-zinc-300" /> Blocked
          </span>
        </div>
      </Panel>

      {/* Date details breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          key={"stay" + selectedDate}
          title={`In-House on ${formatDate(selectedDate)}`}
          subtitle={`${onSelectedDay.length} guests staying in hotel on this date`}
        >
          {onSelectedDay.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#64748b]">No active stays on this date.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {onSelectedDay.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBooking(b)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gold/25 bg-[#FAF7F2] p-3 text-left transition hover:border-gold hover:bg-gold/10 cursor-pointer text-xs"
                >
                  <div>
                    <p className="font-bold text-[#061830]">{b.guestName}</p>
                    <p className="text-[11px] text-[#64748b]">
                      Room {b.roomNumber || "Unassigned"} · {getCategory(state, b.categoryId)?.name} · #{b.id}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          key={"arr" + selectedDate}
          title={`Arrivals Scheduled for ${formatDate(selectedDate)}`}
          subtitle={`${arrivingOnDay.length} check-ins arriving`}
        >
          {arrivingOnDay.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#64748b]">No arrivals scheduled for this date.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {arrivingOnDay.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBooking(b)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gold/25 bg-[#FAF7F2] p-3 text-left transition hover:border-gold hover:bg-gold/10 cursor-pointer text-xs"
                >
                  <div>
                    <p className="font-bold text-[#061830]">{b.guestName}</p>
                    <p className="text-[11px] text-[#64748b]">
                      {getCategory(state, b.categoryId)?.name} · Phone: {b.phone}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Booking Dialog Modal */}
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
